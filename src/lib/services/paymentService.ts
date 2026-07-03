import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import type { PaymentGateway } from "@/lib/types/database";

export type CreatePaymentInput = {
  orderId: string;
  userId: string;
  amount: number;
  gateway: PaymentGateway;
};

export type CreatePaymentResult = {
  payment_id: string;
  merchant_trade_no: string;
  gateway: PaymentGateway;
  /** Phase 1: redirect URL placeholder for ECPay / NewebPay */
  redirect_url: string | null;
  status: string;
};

/** Phase 1 stub — reserves ECPay / NewebPay integration points */
export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const merchantTradeNo = `PAY${Date.now()}${randomBytes(3).toString("hex")}`;

  if (!isSupabaseConfigured()) {
    return {
      payment_id: `mock-${merchantTradeNo}`,
      merchant_trade_no: merchantTradeNo,
      gateway: input.gateway,
      redirect_url: null,
      status: "unpaid",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .insert({
      order_id: input.orderId,
      user_id: input.userId,
      amount: input.amount,
      gateway: input.gateway,
      merchant_trade_no: merchantTradeNo,
      status: "unpaid",
    })
    .select("id, merchant_trade_no, gateway, status")
    .single();

  if (error || !data) throw new Error(error?.message ?? "建立付款失敗");

  let redirectUrl: string | null = null;
  if (input.gateway === "ecpay") {
    // TODO: ECPay AIO checkout — build form POST to ECPay gateway
    redirectUrl = null;
  } else if (input.gateway === "newebpay") {
    // TODO: NewebPay MPG — build encrypted trade info
    redirectUrl = null;
  }

  return {
    payment_id: data.id,
    merchant_trade_no: data.merchant_trade_no,
    gateway: data.gateway as PaymentGateway,
    redirect_url: redirectUrl,
    status: data.status,
  };
}

export async function handlePaymentCallback(payload: Record<string, unknown>) {
  if (!isSupabaseConfigured()) {
    return { ok: true, message: "mock callback accepted" };
  }

  const merchantTradeNo = String(payload.MerchantTradeNo ?? payload.TradeNo ?? "");
  if (!merchantTradeNo) {
    return { ok: false, message: "missing trade number" };
  }

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, status")
    .eq("merchant_trade_no", merchantTradeNo)
    .single();

  if (!payment) return { ok: false, message: "payment not found" };

  const rtnCode = payload.RtnCode ?? payload.Status;
  const paid = rtnCode === "1" || rtnCode === 1 || payload.status === "SUCCESS";

  if (paid) {
    await admin
      .from("payments")
      .update({
        status: "paid_online",
        gateway_trade_no: String(payload.TradeNo ?? payload.TradeID ?? ""),
        raw_response: payload,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    await admin
      .from("orders")
      .update({
        payment_status: "paid_online",
        status: "payment_confirmed",
        pickup_status: "ready",
      })
      .eq("id", payment.order_id);
  } else {
    await admin
      .from("payments")
      .update({ status: "failed", raw_response: payload })
      .eq("id", payment.id);
  }

  return { ok: true, payment_id: payment.id, paid };
}

/** 下單時建立付款紀錄（門市付款／轉帳等，尚未串金流） */
export async function recordInitialPayment(input: CreatePaymentInput): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const merchantTradeNo = `PAY${Date.now()}${randomBytes(3).toString("hex")}`;
  const admin = createAdminClient();
  const { error } = await admin.from("payments").insert({
    order_id: input.orderId,
    user_id: input.userId,
    amount: input.amount,
    gateway: input.gateway,
    merchant_trade_no: merchantTradeNo,
    status: "unpaid",
  });

  if (error) throw new Error(error.message);
}
