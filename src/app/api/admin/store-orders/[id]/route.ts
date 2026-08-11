import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { getStaffStoreId } from "@/lib/services/pickupService";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  assertManagerAction,
  issuePickupCode,
  transitionOrderStatus,
} from "@/lib/fulfillment/transitions";
import { addDays } from "@/lib/fulfillment/settings";
import { getFulfillmentSettings } from "@/lib/fulfillment/settings-store";
import type { FulfillmentStatus } from "@/lib/fulfillment/status";

type Ctx = { params: Promise<{ id: string }> };

const ACTION_STATUS: Record<string, FulfillmentStatus> = {
  accept: "preparing",
  start_preparing: "preparing",
  mark_ready: "ready_for_pickup",
  complete: "completed",
  request_cancel: "cancel_requested",
  request_refund: "refund_pending",
  mark_exception: "exception",
  mark_out_of_stock: "exception",
};

export async function GET(_request: Request, ctx: Ctx) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  if (!isSupabaseConfigured()) return NextResponse.json({ order: null });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "*, order_items(*), pickup_store:stores!orders_pickup_store_id_fkey(*), order_status_logs(*)"
    )
    .eq("id", id)
    .single();
  if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

  const role = auth!.profile.role;
  if (!["admin", "customer_service"].includes(role)) {
    const staffStore = await getStaffStoreId(auth!.profile.id);
    const storeId = order.pickup_store_id ?? order.store_id;
    if (staffStore && storeId && staffStore !== storeId) {
      return NextResponse.json({ error: "此訂單不屬於您的門市" }, { status: 403 });
    }
  }

  return NextResponse.json({ order });
}

export async function POST(request: Request, ctx: Ctx) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const note = typeof body.note === "string" ? body.note : null;
  const role = auth!.profile.role;

  if (["request_refund", "request_cancel"].includes(action)) {
    try {
      assertManagerAction(role);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "權限不足" },
        { status: 403 }
      );
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const admin = createAdminClient();

  if (action === "extend_deadline") {
    try {
      assertManagerAction(role);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "權限不足" },
        { status: 403 }
      );
    }
    const { data: order } = await admin
      .from("orders")
      .select("pickup_deadline_at, pickup_extended")
      .eq("id", id)
      .single();
    if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    const settings = await getFulfillmentSettings();
    if (order.pickup_extended && settings.allow_extend_once) {
      return NextResponse.json({ error: "已延長過一次取貨期限" }, { status: 400 });
    }
    const base = order.pickup_deadline_at ?? new Date().toISOString();
    const next = addDays(base, settings.extend_days);
    await admin
      .from("orders")
      .update({
        pickup_deadline_at: next,
        pickup_extended: true,
        fulfillment_status: "ready_for_pickup",
        status: "ready_for_pickup",
      })
      .eq("id", id);
    await admin.from("order_status_logs").insert({
      order_id: id,
      from_status: "pickup_expired",
      to_status: "ready_for_pickup",
      actor_id: auth!.profile.id,
      actor_role: role,
      note: note ?? `延長取貨期限至 ${next}`,
    });
    await issuePickupCode(id);
    return NextResponse.json({ ok: true, pickup_deadline_at: next });
  }

  if (action === "notify_pickup") {
    const { sendFulfillmentNotification } = await import(
      "@/lib/fulfillment/notifications"
    );
    await sendFulfillmentNotification(id, "ready_for_pickup");
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_exception" || action === "mark_out_of_stock") {
    const reason = action === "mark_out_of_stock" ? "缺貨" : body.reason ?? "異常";
    await admin
      .from("orders")
      .update({
        exception_reason: reason,
        exception_notes: note,
      })
      .eq("id", id);
    await admin.from("order_exceptions").insert({
      order_id: id,
      reason,
      handler_id: auth!.profile.id,
      resolution: note,
    });
  }

  const to = ACTION_STATUS[action];
  if (!to) {
    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  }

  try {
    const result = await transitionOrderStatus({
      orderId: id,
      to,
      actorId: auth!.profile.id,
      actorRole: role,
      note,
      request,
      meta: { action },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "狀態更新失敗" },
      { status: 400 }
    );
  }
}
