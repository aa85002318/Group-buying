import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function updateReward(request: Request, status: string, extra?: Record<string, unknown>) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const { id, reject_reason } = await request.json();
  const admin = createAdminClient();
  const { data: old } = await admin.from("reward_records").select("*").eq("id", id).single();

  const update: Record<string, unknown> = {
    status,
    approved_by: auth!.profile.id,
    approved_at: new Date().toISOString(),
    ...extra,
  };
  if (reject_reason) update.reject_reason = reject_reason;
  if (status === "issued") {
    update.issued_by = auth!.profile.id;
    update.issued_at = new Date().toISOString();
  }

  const { data, error } = await admin.from("reward_records").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, status, "reward_record", id, old, data, request as never);
  return NextResponse.json({ reward: data });
}

export async function PATCH(request: Request) {
  const { action } = await request.json();
  if (action === "approve") return updateReward(request, "approved");
  if (action === "reject") return updateReward(request, "rejected");
  if (action === "issue") return updateReward(request, "issued");
  return NextResponse.json({ error: "無效操作" }, { status: 400 });
}
