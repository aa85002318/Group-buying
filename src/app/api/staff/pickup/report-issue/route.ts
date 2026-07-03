import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getStaffStoreId, reportPickupIssue } from "@/lib/services/pickupService";

export async function POST(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  const { order_id: orderId, notes } = await request.json();
  if (!orderId || !notes?.trim()) {
    return NextResponse.json({ error: "請填寫異常說明" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const staffStoreId = await getStaffStoreId(auth!.profile.id);
    await reportPickupIssue(
      orderId,
      auth!.profile.id,
      notes.trim(),
      auth!.profile.role === "admin" ? null : staffStoreId
    );
    await logAudit(auth!.profile.id, "report_pickup_issue", "order", orderId, null, { notes });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "操作失敗" }, { status: 400 });
  }
}
