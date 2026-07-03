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
    record.status = "issued";
    record.issued_by = auth!.profile.id;
    record.issued_at = now;
    record.payout_method = body.payoutMethod ?? "cash";
    record.payout_note = body.payoutNote ?? null;
    return NextResponse.json({ record });
  }

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("commission_records")
    .update({
      status: "issued",
      issued_by: auth!.profile.id,
      issued_at: now,
      payout_method: body.payoutMethod ?? "cash",
      payout_note: body.payoutNote,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: "紀錄不存在" }, { status: 404 });
  await logAudit(auth!.profile.id, "issue_commission", "commission_record", id, null, data);
  return NextResponse.json({ record: data });
}
