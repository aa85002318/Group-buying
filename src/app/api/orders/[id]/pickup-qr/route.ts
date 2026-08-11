import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalizeStatus, pickupCodeAllowed } from "@/lib/fulfillment/status";
import { decryptPickupPin, qrPayloadForToken } from "@/lib/fulfillment/pickup-code";
import { getActivePickupCode } from "@/lib/fulfillment/transitions";

/** Returns QR + 6-digit PIN only when order is ready_for_pickup. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const qr = await QRCode.toDataURL(`chimeidiy://pickup?token=mock-${id}`, {
      width: 280,
      margin: 2,
    });
    return NextResponse.json({
      qr_data_url: qr,
      pin: "000000",
      allowed: true,
    });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, pickup_token, status, fulfillment_status, pickup_deadline_at")
    .eq("id", id)
    .single();

  if (!order || order.user_id !== auth!.profile.id) {
    return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  }

  const fulfillment = canonicalizeStatus(order.status, order.fulfillment_status);
  if (!pickupCodeAllowed(fulfillment)) {
    return NextResponse.json(
      {
        error: "取貨碼僅在「可取貨」時有效",
        allowed: false,
        fulfillment,
      },
      { status: 403 }
    );
  }

  if (order.pickup_deadline_at && new Date(order.pickup_deadline_at) < new Date()) {
    return NextResponse.json(
      { error: "取貨碼已過期", allowed: false, expired: true },
      { status: 410 }
    );
  }

  const code = await getActivePickupCode(id);
  const token = code?.pickup_token ?? order.pickup_token;
  if (!token) {
    return NextResponse.json({ error: "尚無取貨碼" }, { status: 404 });
  }

  const payload = code?.qr_payload || qrPayloadForToken(token);
  const qr = await QRCode.toDataURL(payload, { width: 280, margin: 2 });
  return NextResponse.json({
    qr_data_url: qr,
    pin: decryptPickupPin(code?.pin_cipher) ?? null,
    expires_at: code?.expires_at ?? order.pickup_deadline_at,
    allowed: true,
  });
}
