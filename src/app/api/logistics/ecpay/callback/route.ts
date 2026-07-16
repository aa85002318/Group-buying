import { NextResponse } from "next/server";
import { handlePaymentCallback } from "@/lib/services/paymentService";

/**
 * ECPay logistics server callback placeholder.
 * Full create-shipment flow will use this endpoint once logistics is enabled.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    payload = await request.json().catch(() => ({}));
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries());
  }

  console.info("[ecpay-logistics] callback", {
    keys: Object.keys(payload),
    merchantTradeNo: payload.MerchantTradeNo ?? payload.AllPayLogisticsID,
  });

  // Reuse payment handler only when trade no matches payments; otherwise acknowledge.
  const tradeNo = String(payload.MerchantTradeNo ?? "");
  if (tradeNo.startsWith("PAY")) {
    const result = await handlePaymentCallback(payload);
    return NextResponse.json(result);
  }

  return NextResponse.json({ ok: true, received: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = Object.fromEntries(searchParams.entries());
  return NextResponse.json({ ok: true, received: true, query: payload });
}
