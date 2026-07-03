import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/** Returns QR data URL — payload is pickup_token only (no PII) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const qr = await QRCode.toDataURL(`mock-token-${id}`, { width: 280, margin: 2 });
    return NextResponse.json({ qr_data_url: qr, pickup_token: `mock-token-${id}` });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, pickup_token")
    .eq("id", id)
    .single();

  if (!order || order.user_id !== auth!.profile.id) {
    return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  }

  if (!order.pickup_token) {
    return NextResponse.json({ error: "尚無取貨碼" }, { status: 404 });
  }

  const qr = await QRCode.toDataURL(order.pickup_token, { width: 280, margin: 2 });
  return NextResponse.json({ qr_data_url: qr, pickup_token: order.pickup_token });
}
