import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { sendEmail, type SendEmailResult } from "@/lib/email/send";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { buildPickupConfirmationEmail } from "@/lib/email/templates/pickup-confirmation";
import { buildOrderUnpaidEmail } from "@/lib/email/templates/order-unpaid";
import { buildOrderCancelledEmail } from "@/lib/email/templates/order-cancelled";
import { buildOrderArrivalEmail } from "@/lib/email/templates/order-arrival";
import { getEmailTemplate } from "@/lib/email/template-store";

export type OrderEmailType = "confirmation" | "unpaid" | "cancelled" | "arrival";

async function getUserEmail(userId: string): Promise<{ email: string; fullName: string } | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    return { email: profile.email, fullName: profile.full_name ?? "" };
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  if (!authUser.user?.email) return null;

  return {
    email: authUser.user.email,
    fullName: authUser.user.user_metadata?.full_name ?? "",
  };
}

async function getStoreInfo(storeId: string | null | undefined): Promise<{ name?: string; address?: string } | null> {
  if (!storeId || !isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("stores").select("name, address").eq("id", storeId).maybeSingle();
  return data;
}

type OrderEmailRow = {
  id: string;
  order_no?: string | null;
  order_number?: string | null;
  user_id: string;
  subtotal?: number | null;
  discount_amount?: number | null;
  shipping_fee?: number | null;
  total_amount: number;
  created_at: string;
  store_id?: string | null;
  pickup_store_id?: string | null;
  notes?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  order_items?: Array<{ product_name: string; quantity: number; subtotal?: number }>;
};

async function loadOrderForEmail(orderId: string): Promise<OrderEmailRow | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_no, order_number, user_id, subtotal, discount_amount, shipping_fee, total_amount, created_at, store_id, pickup_store_id, notes, customer_email, customer_name, order_items(product_name, quantity, subtotal)"
    )
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("[email] loadOrderForEmail failed:", error.message);
    return null;
  }
  return order as OrderEmailRow | null;
}

async function resolveRecipient(order: OrderEmailRow): Promise<{ email: string; fullName: string } | null> {
  const fromProfile = order.user_id ? await getUserEmail(order.user_id) : null;
  const email = fromProfile?.email?.trim() || order.customer_email?.trim() || "";
  if (!email) return null;
  return {
    email,
    fullName: fromProfile?.fullName || order.customer_name || "",
  };
}

function failResult(message: string): SendEmailResult {
  console.error("[email]", message);
  return { ok: false, error: message };
}

/** Send order confirmation; returns Resend result (does not swallow send failures). */
export async function sendOrderConfirmationEmail(orderId: string): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return failResult("訂單不存在或無法讀取");

    const recipient = await resolveRecipient(order);
    if (!recipient?.email) return failResult("找不到收件 Email");

    const store = await getStoreInfo(order.pickup_store_id ?? order.store_id);
    const orderNo = order.order_no ?? order.order_number ?? order.id.slice(0, 8);
    const template = await getEmailTemplate("order_confirmation");
    const { subject, html } = buildOrderConfirmationEmail(
      {
        customerName: recipient.fullName,
        orderId: order.id,
        orderNo,
        totalAmount: Number(order.total_amount),
        subtotal: Number(order.subtotal ?? order.total_amount),
        discount: Number(order.discount_amount ?? 0),
        shippingFee: Number(order.shipping_fee ?? 0),
        createdAt: order.created_at,
        storeName: store?.name,
        storeAddress: store?.address,
        items: (order.order_items ?? []).map((i) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          subtotal: Number(i.subtotal ?? 0),
        })),
      },
      template
    );

    const result = await sendEmail({ to: recipient.email, subject, html });
    if (!result.ok) console.error("[email] order confirmation Resend failed:", result.error);
    return result;
  } catch (e) {
    console.error("[email] order confirmation failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "訂單確認信寄送失敗" };
  }
}

export async function sendPickupConfirmationEmail(orderId: string, pickedUpAt: string): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return failResult("訂單不存在或無法讀取");

    const recipient = await resolveRecipient(order);
    if (!recipient?.email) return failResult("找不到收件 Email");

    const store = await getStoreInfo(order.pickup_store_id ?? order.store_id);
    const orderNo = order.order_no ?? order.order_number ?? order.id.slice(0, 8);
    const { subject, html } = buildPickupConfirmationEmail({
      customerName: recipient.fullName,
      orderId: order.id,
      orderNo,
      totalAmount: Number(order.total_amount),
      pickedUpAt,
      storeName: store?.name,
      items: (order.order_items ?? []).map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
      })),
    });

    return await sendEmail({ to: recipient.email, subject, html });
  } catch (e) {
    console.error("[email] pickup confirmation failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "取貨確認信寄送失敗" };
  }
}

export async function sendOrderUnpaidEmail(orderId: string): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return failResult("訂單不存在或無法讀取");

    const recipient = await resolveRecipient(order);
    if (!recipient?.email) return failResult("找不到收件 Email");

    const store = await getStoreInfo(order.pickup_store_id ?? order.store_id);
    const orderNo = order.order_no ?? order.order_number ?? order.id.slice(0, 8);
    const template = await getEmailTemplate("order_unpaid");
    const { subject, html } = buildOrderUnpaidEmail(
      {
        customerName: recipient.fullName,
        orderId: order.id,
        orderNo,
        totalAmount: Number(order.total_amount),
        createdAt: order.created_at,
        storeName: store?.name,
      },
      template
    );

    const result = await sendEmail({ to: recipient.email, subject, html });
    if (!result.ok) console.error("[email] unpaid Resend failed:", result.error);
    return result;
  } catch (e) {
    console.error("[email] unpaid notice failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "未付款通知寄送失敗" };
  }
}

export async function sendOrderCancelledEmail(orderId: string, reason?: string): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return failResult("訂單不存在或無法讀取");

    const recipient = await resolveRecipient(order);
    if (!recipient?.email) return failResult("找不到收件 Email");

    const orderNo = order.order_no ?? order.order_number ?? order.id.slice(0, 8);
    const template = await getEmailTemplate("order_cancelled");
    const { subject, html } = buildOrderCancelledEmail(
      {
        customerName: recipient.fullName,
        orderId: order.id,
        orderNo,
        totalAmount: Number(order.total_amount),
        createdAt: order.created_at,
        reason: reason ?? null,
      },
      template
    );

    const result = await sendEmail({ to: recipient.email, subject, html });
    if (!result.ok) console.error("[email] cancelled Resend failed:", result.error);
    return result;
  } catch (e) {
    console.error("[email] cancelled notice failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "取消通知寄送失敗" };
  }
}

export async function sendOrderArrivalEmail(orderId: string): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return failResult("訂單不存在或無法讀取");

    const recipient = await resolveRecipient(order);
    if (!recipient?.email) return failResult("找不到收件 Email");

    const store = await getStoreInfo(order.pickup_store_id ?? order.store_id);
    const orderNo = order.order_no ?? order.order_number ?? order.id.slice(0, 8);
    const { subject, html } = buildOrderArrivalEmail({
      customerName: recipient.fullName,
      orderId: order.id,
      orderNo,
      totalAmount: Number(order.total_amount),
      storeName: store?.name,
      storeAddress: store?.address,
      items: (order.order_items ?? []).map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
      })),
    });

    const result = await sendEmail({ to: recipient.email, subject, html });
    if (!result.ok) console.error("[email] arrival Resend failed:", result.error);
    return result;
  } catch (e) {
    console.error("[email] arrival notice failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "到貨通知寄送失敗" };
  }
}

/** Send (or resend) a customer order email; returns result for admin UI. */
export async function sendOrderEmailByType(
  orderId: string,
  type: OrderEmailType,
  options?: { reason?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "郵件服務未設定" };
    }

    let result: SendEmailResult;
    switch (type) {
      case "confirmation":
        result = await sendOrderConfirmationEmail(orderId);
        break;
      case "unpaid":
        result = await sendOrderUnpaidEmail(orderId);
        break;
      case "cancelled":
        result = await sendOrderCancelledEmail(orderId, options?.reason);
        break;
      case "arrival":
        result = await sendOrderArrivalEmail(orderId);
        break;
      default:
        return { ok: false, error: "未知的信件類型" };
    }

    if (!result.ok) {
      return { ok: false, error: result.error ?? "寄送失敗" };
    }
    if (result.skipped) {
      return { ok: false, error: "伺服器未設定 RESEND_API_KEY，信件未寄出" };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] sendOrderEmailByType failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "寄送失敗" };
  }
}
