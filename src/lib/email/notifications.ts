import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { sendEmail } from "@/lib/email/send";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { buildPickupConfirmationEmail } from "@/lib/email/templates/pickup-confirmation";

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

/** Fire-and-forget: never throw to caller. */
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    if (!isSupabaseConfigured()) return;

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select(
        "id, order_no, order_number, user_id, subtotal, discount_amount, shipping_fee, total_amount, created_at, store_id, pickup_store_id, order_items(product_name, quantity, subtotal)"
      )
      .eq("id", orderId)
      .single();

    if (!order?.user_id) return;

    const recipient = await getUserEmail(order.user_id);
    if (!recipient?.email) return;

    const store = await getStoreInfo(order.pickup_store_id ?? order.store_id);
    const orderNo = order.order_no ?? order.order_number ?? order.id.slice(0, 8);
    const { subject, html } = buildOrderConfirmationEmail({
      customerName: recipient.fullName,
      orderId: order.id,
      orderNo,
      totalAmount: Number(order.total_amount),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount_amount ?? 0),
      shippingFee: Number(order.shipping_fee ?? 0),
      createdAt: order.created_at,
      storeName: store?.name,
      storeAddress: store?.address,
      items: (order.order_items ?? []).map((i: { product_name: string; quantity: number; subtotal: number }) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
      })),
    });

    await sendEmail({ to: recipient.email, subject, html });
  } catch (e) {
    console.error("[email] order confirmation failed:", e);
  }
}

/** Fire-and-forget: never throw to caller. */
export async function sendPickupConfirmationEmail(orderId: string, pickedUpAt: string): Promise<void> {
  try {
    if (!isSupabaseConfigured()) return;

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select(
        "id, order_no, order_number, user_id, total_amount, store_id, pickup_store_id, order_items(product_name, quantity)"
      )
      .eq("id", orderId)
      .single();

    if (!order?.user_id) return;

    const recipient = await getUserEmail(order.user_id);
    if (!recipient?.email) return;

    const store = await getStoreInfo(order.pickup_store_id ?? order.store_id);
    const orderNo = order.order_no ?? order.order_number ?? order.id.slice(0, 8);
    const { subject, html } = buildPickupConfirmationEmail({
      customerName: recipient.fullName,
      orderId: order.id,
      orderNo,
      totalAmount: Number(order.total_amount),
      pickedUpAt,
      storeName: store?.name,
      items: (order.order_items ?? []).map((i: { product_name: string; quantity: number }) => ({
        product_name: i.product_name,
        quantity: i.quantity,
      })),
    });

    await sendEmail({ to: recipient.email, subject, html });
  } catch (e) {
    console.error("[email] pickup confirmation failed:", e);
  }
}
