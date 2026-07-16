import { NextResponse } from "next/server";
import { requireAuth, requireVerifiedAuth, logAudit } from "@/lib/auth";
import { createOrder, getMyOrders, OrderError } from "@/lib/services/orderService";
import { sendOrderConfirmationEmail } from "@/lib/email/notifications";
import type { PaymentGateway, ShipmentMethod } from "@/lib/types/database";

export async function GET() {
  const { error: authError, auth } = await requireAuth();
  if (authError) return authError;

  const orders = await getMyOrders(auth!.profile.id);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireVerifiedAuth();
  if (authError) return authError;

  const body = await request.json();
  const {
    items,
    store_id,
    group_buy_event_id,
    referral_code,
    livestream_id,
    notes,
    payment_method,
    shipment_method,
    recipient_name,
    recipient_phone,
    customer_email,
    shipping_address,
    cvs_store_id,
    coupon_code,
    shipping_fee,
    discount,
    store_credit_used,
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "購物車是空的" }, { status: 400 });
  }

  const shipmentMethod = (shipment_method as ShipmentMethod) ?? "store_pickup";
  if (shipmentMethod === "store_pickup" && !store_id) {
    return NextResponse.json({ error: "請選擇取貨門市" }, { status: 400 });
  }

  const paymentMethod = (payment_method as PaymentGateway) ?? "store_cash";
  if (paymentMethod === "ecpay" || paymentMethod === "newebpay") {
    return NextResponse.json({ error: "線上金流尚未開放，請選擇門市付款或銀行轉帳" }, { status: 400 });
  }

  if (shipmentMethod === "home_delivery" || shipmentMethod === "cvs_pickup") {
    return NextResponse.json({ error: "宅配／超商物流尚未開放，請選擇門市取貨" }, { status: 400 });
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
      paymentMethod,
      shipmentMethod,
      recipientName: recipient_name,
      recipientPhone: recipient_phone,
      customerEmail: customer_email ?? auth!.user.email,
      shippingAddress: shipping_address,
      cvsStoreId: cvs_store_id,
      couponCode: coupon_code,
      shippingFee: shipping_fee,
      discount,
      storeCreditUsed: store_credit_used,
    });

    await logAudit(auth!.profile.id, "create", "order", order.id, null, order, request as never);
    // Await so serverless runtime does not freeze before Resend finishes
    const mail = await sendOrderConfirmationEmail(order.id);
    if (!mail.ok) {
      console.error("[orders] confirmation email failed:", mail.error);
    }
    return NextResponse.json({
      order,
      email_sent: mail.ok && !mail.skipped,
      email_warning: mail.ok ? undefined : mail.error ?? "訂單確認信寄送失敗",
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "建立訂單失敗" }, { status: 500 });
  }
}
