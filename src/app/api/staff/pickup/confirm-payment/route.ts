import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { confirmStorePayment, getStaffStoreId } from "@/lib/services/pickupService";

export async function POST(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  const { order_id: orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "缺少訂單 ID" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const staffStoreId = await getStaffStoreId(auth!.profile.id);
    const order = await confirmStorePayment(
      orderId,
      auth!.profile.id,
      auth!.profile.role === "admin" ? null : staffStoreId
    );
    await logAudit(auth!.profile.id, "confirm_store_payment", "order", orderId, null, order);
    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "操作失敗" }, { status: 400 });
  }
}
