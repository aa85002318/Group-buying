import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { sendPickupConfirmationEmail } from "@/lib/email/notifications";
import { sendOrderLineNotification } from "@/lib/line/notifications";
import type { OrderPaymentStatus, OrderPickupStatus, PickupLookupResult } from "@/lib/types/database";

export type { PickupLookupResult };

export function generatePickupToken(): string {
  return randomBytes(16).toString("hex");
}

export async function createPickupCodeForOrder(orderId: string, pickupToken: string) {
  if (!isSupabaseConfigured()) return { pickup_token: pickupToken };

  const admin = createAdminClient();
  const { error } = await admin.from("pickup_codes").insert({
    order_id: orderId,
    pickup_token: pickupToken,
    qr_payload: pickupToken,
  });
  if (error) throw new Error(error.message);
  return { pickup_token: pickupToken };
}

export const getOrderByPickupToken = lookupOrderByPickupToken;

export async function lookupOrderByPickupToken(
  pickupToken: string,
  staffUserId: string,
  staffStoreId?: string | null
): Promise<PickupLookupResult | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, order_no, order_number, total_amount, payment_status, pickup_status, status, store_id, pickup_store_id, customer_name, customer_phone, profiles!orders_user_id_fkey(full_name, phone), order_items(product_name, quantity, subtotal)"
    )
    .eq("pickup_token", pickupToken)
    .single();

  if (!order) return null;

  const storeId = order.pickup_store_id ?? order.store_id;
  if (staffStoreId && storeId && staffStoreId !== storeId) {
    throw new Error("此訂單不屬於您的門市");
  }

  const profile = order.profiles as { full_name?: string; phone?: string } | null;
  const phone = order.customer_phone ?? profile?.phone ?? "";
  const phoneLastThree = phone.length >= 3 ? phone.slice(-3) : "—";

  if (order.pickup_status === "picked_up") {
    await writePickupLog(order.id, staffUserId, storeId ?? null, "report_issue", "already_picked_up");
  } else {
    await admin.from("pickup_logs").insert({
      order_id: order.id,
      store_id: storeId,
      staff_id: staffUserId,
      action: "lookup",
      metadata: { pickup_token: pickupToken },
    });
  }

  return {
    order_id: order.id,
    order_no: order.order_no ?? order.order_number,
    customer_name: order.customer_name ?? profile?.full_name ?? "—",
    phone_last_three: phoneLastThree,
    items: (order.order_items ?? []) as PickupLookupResult["items"],
    total_amount: Number(order.total_amount),
    payment_status: order.payment_status as OrderPaymentStatus,
    pickup_status: order.pickup_status as OrderPickupStatus,
    order_status: order.status,
  };
}

export async function writePickupLog(
  orderId: string,
  staffId: string,
  storeId: string | null,
  action: "confirm_payment" | "confirm_pickup" | "report_issue",
  notes?: string,
  metadata?: Record<string, unknown>
) {
  const admin = createAdminClient();
  await admin.from("pickup_logs").insert({
    order_id: orderId,
    store_id: storeId,
    staff_id: staffId,
    action,
    notes: notes ?? null,
    metadata: metadata ?? {},
  });
}

export const confirmPayment = confirmStorePayment;

export async function confirmStorePayment(
  orderId: string,
  staffUserId: string,
  staffStoreId?: string | null
) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, store_id, pickup_store_id, payment_status, total_amount, user_id")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("訂單不存在");

  const storeId = order.pickup_store_id ?? order.store_id;
  if (staffStoreId && storeId && staffStoreId !== storeId) {
    throw new Error("此訂單不屬於您的門市");
  }

  if (order.payment_status === "paid_store" || order.payment_status === "paid_online") {
    throw new Error("此訂單已確認收款");
  }

  const { data, error } = await admin
    .from("orders")
    .update({
      payment_status: "paid_store",
      status: "payment_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await admin.from("payments").insert({
    order_id: orderId,
    user_id: order.user_id,
    amount: order.total_amount,
    gateway: "store_cash",
    status: "paid_store",
    paid_at: new Date().toISOString(),
  });

  // LINE 通知（付款已確認）：僅在使用 LINE 綁定後才會送出
  await sendOrderLineNotification(orderId, "payment_confirmed").catch((e) => {
    console.warn("[line] payment_confirmed notification failed:", e);
  });

  await writePickupLog(orderId, staffUserId, storeId, "confirm_payment");
  return data;
}

export async function confirmPickup(
  orderId: string,
  staffUserId: string,
  staffStoreId?: string | null
) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, store_id, pickup_store_id, payment_status, pickup_status")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("訂單不存在");

  const storeId = order.pickup_store_id ?? order.store_id;
  if (staffStoreId && storeId && staffStoreId !== storeId) {
    throw new Error("此訂單不屬於您的門市");
  }

  if (order.pickup_status === "picked_up") {
    throw new Error("此訂單已完成取貨");
  }

  if (!["paid_online", "paid_store"].includes(order.payment_status)) {
    throw new Error("請先確認收款後再取貨");
  }

  const { data, error } = await admin
    .from("orders")
    .update({
      pickup_status: "picked_up",
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const pickedUpAt = new Date().toISOString();

  await admin.from("shipments").update({
    status: "picked_up",
    picked_up_at: pickedUpAt,
  }).eq("order_id", orderId);

  await admin.from("pickup_records").insert({
    order_id: orderId,
    store_id: storeId ?? order.store_id,
    staff_user_id: staffUserId,
    picked_up_at: pickedUpAt,
    verified_by: staffUserId,
  });

  await writePickupLog(orderId, staffUserId, storeId, "confirm_pickup");
  const mail = await sendPickupConfirmationEmail(orderId, pickedUpAt);
  if (!mail.ok) {
    console.error("[pickup] confirmation email failed:", mail.error);
  }

  return data;
}

export async function reportPickupIssue(
  orderId: string,
  staffUserId: string,
  notes: string,
  staffStoreId?: string | null
) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, store_id, pickup_store_id")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("訂單不存在");

  const storeId = order.pickup_store_id ?? order.store_id;
  if (staffStoreId && storeId && staffStoreId !== storeId) {
    throw new Error("此訂單不屬於您的門市");
  }

  await writePickupLog(orderId, staffUserId, storeId, "report_issue", notes);
  return { ok: true };
}

export async function getStaffStoreId(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  const { data: staffRow } = await admin
    .from("staff")
    .select("store_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (staffRow?.store_id) return staffRow.store_id;

  const { data: profile } = await admin
    .from("profiles")
    .select("store_id")
    .eq("id", userId)
    .single();
  return profile?.store_id ?? null;
}
