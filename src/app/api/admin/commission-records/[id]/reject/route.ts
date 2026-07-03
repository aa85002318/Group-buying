import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const record = mockStore.commissions.find((r) => r.id === id);
    if (!record) return NextResponse.json({ error: "紀錄不存在" }, { status: 404 });
    record.status = "rejected";
    record.reason = body.reason ?? record.reason;
    record.reviewed_by = auth!.profile.id;
    record.reviewed_at = now;
    return NextResponse.json({ record });
  }

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("commission_records")
    .update({ status: "rejected", reason: body.reason, reviewed_by: auth!.profile.id, reviewed_at: now })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: "紀錄不存在" }, { status: 404 });
  await logAudit(auth!.profile.id, "reject_commission", "commission_record", id, null, data);
  return NextResponse.json({ record: data });
}
