import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { monsterMockStore } from "@/lib/monster-mock";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const adminId = auth!.profile.id;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const record = monsterMockStore.shareRecords.find((s) => s.id === id);
    if (!record) return NextResponse.json({ error: "分享紀錄不存在" }, { status: 404 });
    if (record.status !== "pending_review") {
      return NextResponse.json({ error: "此紀錄已審核" }, { status: 400 });
    }
    record.status = "rejected";
    record.reviewed_by = adminId;
    record.reviewed_at = now;
    return NextResponse.json({ shareRecord: record });
  }

  const admin = createAdminClient();
  const { data: record } = await admin
    .from("product_share_records")
    .select("*")
    .eq("id", id)
    .single();

  if (!record) return NextResponse.json({ error: "分享紀錄不存在" }, { status: 404 });
  if (record.status !== "pending_review") {
    return NextResponse.json({ error: "此紀錄已審核" }, { status: 400 });
  }

  const { data: updated } = await admin
    .from("product_share_records")
    .update({
      status: "rejected",
      reviewed_by: adminId,
      reviewed_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  await logAudit(adminId, "reject_monster_share", "product_share_record", id, record, updated);

  return NextResponse.json({ shareRecord: updated });
}
