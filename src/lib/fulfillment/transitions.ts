import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { logAudit } from "@/lib/auth";
import {
  canTransition,
  canonicalizeStatus,
  writableOrderStatus,
  type FulfillmentStatus,
} from "./status";
import {
  encryptPickupPin,
  generatePickupPin,
  generatePublicPickupToken,
  hashPickupPin,
  qrPayloadForToken,
} from "./pickup-code";
import { addDays, holdDaysForZones } from "./settings";
import { getFulfillmentSettings } from "./settings-store";
import { sendFulfillmentNotification } from "./notifications";

type TransitionInput = {
  orderId: string;
  to: FulfillmentStatus;
  actorId: string | null;
  actorRole?: string | null;
  note?: string | null;
  request?: Request;
  meta?: Record<string, unknown>;
};

export async function transitionOrderStatus(input: TransitionInput) {
  if (!isSupabaseConfigured()) {
    return { ok: true as const, from: "pending_payment" as FulfillmentStatus, to: input.to };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, status, fulfillment_status, pickup_status, payment_status, pickup_store_id, store_id, pickup_deadline_at, pickup_extended, user_id"
    )
    .eq("id", input.orderId)
    .single();

  if (error || !order) throw new Error("訂單不存在");

  const from = canonicalizeStatus(order.status, order.fulfillment_status);
  if (!canTransition(from, input.to)) {
    throw new Error(`不可從「${from}」變更為「${input.to}」`);
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    fulfillment_status: input.to,
    status: writableOrderStatus(input.to),
    updated_at: now,
  };

  if (input.to === "preparing") {
    patch.pickup_status = "pending";
  }
  if (input.to === "ready_for_pickup") {
    patch.pickup_status = "ready";
    patch.ready_at = now;
    if (!order.pickup_deadline_at) {
      const settings = await getFulfillmentSettings();
      patch.pickup_deadline_at = addDays(now, holdDaysForZones(settings, ["ambient"]));
    }
  }
  if (input.to === "picked_up") {
    patch.pickup_status = "picked_up";
    patch.picked_up_at = now;
  }
  if (input.to === "pickup_expired") {
    patch.pickup_status = "pending";
  }
  if (input.to === "cancelled" || input.to === "payment_failed") {
    patch.pickup_status = "cancelled";
    await admin
      .from("inventory_reservations")
      .update({ status: "released", updated_at: now })
      .eq("order_id", input.orderId)
      .in("status", ["held", "committed"]);
  }

  const { error: updError } = await admin.from("orders").update(patch).eq("id", input.orderId);
  if (updError) throw new Error(updError.message);

  await admin.from("order_status_logs").insert({
    order_id: input.orderId,
    from_status: from,
    to_status: input.to,
    actor_id: input.actorId,
    actor_role: input.actorRole ?? null,
    note: input.note ?? null,
    meta: input.meta ?? {},
  });

  if (input.actorId) {
    await logAudit(
      input.actorId,
      "update_order_status",
      "order",
      input.orderId,
      { status: from },
      { status: input.to, note: input.note },
      input.request as never
    );
  }

  if (input.to === "ready_for_pickup") {
    await issuePickupCode(input.orderId);
  }

  if (input.to === "picked_up") {
    await invalidateActivePickupCodes(input.orderId);
    const settings = await getFulfillmentSettings();
    if (settings.auto_complete_after_pickup) {
      await transitionOrderStatus({
        ...input,
        to: "completed",
        note: "取貨後自動完成",
      });
    }
  }

  await sendFulfillmentNotification(input.orderId, input.to).catch((err) => {
    console.warn("[fulfillment] notify failed:", err);
  });

  return { ok: true as const, from, to: input.to };
}

export async function issuePickupCode(orderId: string) {
  const admin = createAdminClient();
  await invalidateActivePickupCodes(orderId);

  const pin = generatePickupPin();
  const token = generatePublicPickupToken();
  const settings = await getFulfillmentSettings();
  const { data: order } = await admin
    .from("orders")
    .select("pickup_deadline_at")
    .eq("id", orderId)
    .single();

  const expiresAt =
    order?.pickup_deadline_at ?? addDays(new Date(), settings.hold_days_ambient);

  await admin.from("pickup_codes").insert({
    order_id: orderId,
    pickup_token: token,
    qr_payload: qrPayloadForToken(token),
    pin_hash: hashPickupPin(pin),
    pin_cipher: encryptPickupPin(pin),
    expires_at: expiresAt,
    is_active: true,
  });

  await admin
    .from("orders")
    .update({ pickup_token: token })
    .eq("id", orderId);

  return { pin, token, expiresAt };
}

export async function invalidateActivePickupCodes(orderId: string) {
  const admin = createAdminClient();
  await admin
    .from("pickup_codes")
    .update({ is_active: false, invalidated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("is_active", true);
}

export async function getActivePickupCode(orderId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pickup_codes")
    .select("*")
    .eq("order_id", orderId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .maybeSingle();
  return data;
}

export function assertManagerAction(role: string | null | undefined) {
  if (!role || !["admin", "store_manager"].includes(role)) {
    throw new Error("此操作僅限門市主管或總管理員");
  }
}
