import { NextResponse } from "next/server";
import { requireVerifiedAuth, logAudit } from "@/lib/auth";
import { createOrder, OrderError } from "@/lib/services/orderService";
import { sendOrderConfirmationEmail } from "@/lib/email/notifications";

export async function POST(request: Request) {
  const { error: authError, auth } = await requireVerifiedAuth();
  if (authError) return authError;

  const body = await request.json();
  const { items, store_id, group_buy_event_id, referral_code, livestream_id, notes } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "購物車是空的" }, { status: 400 });
  }

  try {
    const order = await createOrder({
      userId: auth!.profile.id,
      storeId: store_id,
      groupBuyEventId: group_buy_event_id,
      items: items.map((i: { product_id: string; quantity: number; group_buy_product_id?: string }) => ({
        productId: i.product_id,
        quantity: i.quantity,
        groupBuyProductId: i.group_buy_product_id,
      })),
      referralCode: referral_code,
      livestreamId: livestream_id,
      notes,
    });

    await logAudit(auth!.profile.id, "create", "order", order.id, null, order, request as never);
    void sendOrderConfirmationEmail(order.id);
    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "建立訂單失敗" }, { status: 500 });
  }
}
