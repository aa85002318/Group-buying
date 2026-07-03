import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

async function updateCommissionStatus(
  id: string,
  status: string,
  adminId: string,
  extra?: Record<string, unknown>
) {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const record = mockStore.commissions.find((r) => r.id === id);
    if (!record) return null;
    record.status = status as typeof record.status;
    record.reviewed_by = adminId;
    record.reviewed_at = now;
    if (status === "issued") {
      record.issued_by = adminId;
      record.issued_at = now;
    }
    Object.assign(record, extra ?? {});
    return record;
  }

  const admin = createAdminClient();
  const payload: Record<string, unknown> = { status, ...extra };
  if (["approved", "rejected"].includes(status)) {
    payload.reviewed_by = adminId;
    payload.reviewed_at = now;
  }
  if (status === "issued") {
    payload.issued_by = adminId;
    payload.issued_at = now;
  }

  const { data } = await admin.from("commission_records").update(payload).eq("id", id).select().single();
  return data;
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;
  const { id } = await params;
  const record = await updateCommissionStatus(id, "approved", auth!.profile.id);
  if (!record) return NextResponse.json({ error: "紀錄不存在" }, { status: 404 });
  await logAudit(auth!.profile.id, "approve_commission", "commission_record", id, null, record);
  return NextResponse.json({ record });
}
