import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

async function updateRewardStatus(
  id: string,
  status: "approved" | "rejected" | "issued",
  adminId: string,
  rejectReason?: string
) {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const reward = mockStore.rewards.find((r) => r.id === id);
    if (!reward) return null;
    reward.status = status;
    reward.reviewed_by = adminId;
    reward.reviewed_at = now;
    if (status === "issued") reward.issued_at = now;
    return reward;
  }

  const admin = createAdminClient();
  const payload: Record<string, unknown> = { status };
  if (status === "approved") {
    payload.approved_by = adminId;
    payload.approved_at = now;
  }
  if (status === "rejected") {
    payload.reject_reason = rejectReason;
    payload.approved_by = adminId;
    payload.approved_at = now;
  }
  if (status === "issued") {
    payload.issued_by = adminId;
    payload.issued_at = now;
  }

  const { data } = await admin.from("reward_records").update(payload).eq("id", id).select().single();
  return data;
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;
  const { id } = await params;
  const reward = await updateRewardStatus(id, "approved", auth!.profile.id);
  if (!reward) return NextResponse.json({ error: "獎勵不存在" }, { status: 404 });
  await logAudit(auth!.profile.id, "approve_reward", "reward_record", id, null, reward);
  return NextResponse.json({ reward });
}
