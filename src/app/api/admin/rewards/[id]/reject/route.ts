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
    const reward = mockStore.rewards.find((r) => r.id === id);
    if (!reward) return NextResponse.json({ error: "獎勵不存在" }, { status: 404 });
    reward.status = "rejected";
    reward.reviewed_by = auth!.profile.id;
    reward.reviewed_at = now;
    return NextResponse.json({ reward });
  }

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("reward_records")
    .update({
      status: "rejected",
      reject_reason: body.reason,
      approved_by: auth!.profile.id,
      approved_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: "獎勵不存在" }, { status: 404 });
  await logAudit(auth!.profile.id, "reject_reward", "reward_record", id, null, data);
  return NextResponse.json({ reward: data });
}
