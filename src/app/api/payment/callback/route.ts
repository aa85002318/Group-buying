import { NextResponse } from "next/server";
import { handlePaymentCallback } from "@/lib/services/paymentService";

/**
 * Payment gateway callback (ECPay / NewebPay).
 * Phase 1: accepts POST body and updates payment + order status.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    payload = await request.json();
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries());
  }

  const result = await handlePaymentCallback(payload);
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = Object.fromEntries(searchParams.entries());
  const result = await handlePaymentCallback(payload);
  return NextResponse.json(result);
}
