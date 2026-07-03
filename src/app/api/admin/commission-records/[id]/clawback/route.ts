import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { clawbackCommissions } from "@/lib/services/commissionService";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const record = mockStore.commissions.find((r) => r.id === id);
    if (!record) return NextResponse.json({ error: "紀錄不存在" }, { status: 404 });
    record.status = "clawed_back";
    record.reason = body.reason ?? "管理員追回";
    return NextResponse.json({ record });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin.from("commission_records").select("order_id").eq("id", id).single();

  if (existing?.order_id) {
    await clawbackCommissions(existing.order_id, body.reason ?? "管理員追回", body.refundAmount);
  } else {
    await admin
      .from("commission_records")
      .update({ status: "clawed_back", reason: body.reason ?? "管理員追回" })
      .eq("id", id);
  }

  const { data: record } = await admin.from("commission_records").select("*").eq("id", id).single();
  await logAudit(auth!.profile.id, "clawback_commission", "commission_record", id, null, body);
  return NextResponse.json({ record });
}
