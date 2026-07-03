import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createPayment } from "@/lib/services/paymentService";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentGateway } from "@/lib/types/database";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { order_id: orderId, gateway = "ecpay" } = body as {
    order_id?: string;
    gateway?: PaymentGateway;
  };

  if (!orderId) {
    return NextResponse.json({ error: "缺少訂單 ID" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const result = await createPayment({
      orderId,
      userId: auth!.profile.id,
      amount: 0,
      gateway,
    });
    return NextResponse.json(result);
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, total_amount, payment_status")
    .eq("id", orderId)
    .eq("user_id", auth!.profile.id)
    .single();

  if (!order) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  if (order.payment_status !== "unpaid") {
    return NextResponse.json({ error: "訂單已付款或無法重複付款" }, { status: 400 });
  }

  const result = await createPayment({
    orderId: order.id,
    userId: auth!.profile.id,
    amount: Number(order.total_amount),
    gateway,
  });

  await logAudit(auth!.profile.id, "create_payment", "payment", result.payment_id, null, result);
  return NextResponse.json(result);
}
