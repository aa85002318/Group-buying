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
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const reward = monsterMockStore.rewards.find((r) => r.id === id);
    if (!reward) return NextResponse.json({ error: "獎勵不存在" }, { status: 404 });
    if (reward.status !== "pending_review") {
      return NextResponse.json({ error: "此獎勵無法發放" }, { status: 400 });
    }
    reward.status = "issued";
    reward.issued_at = now;
    return NextResponse.json({ reward });
  }

  const admin = createAdminClient();
  const { data: reward } = await admin
    .from("monster_rewards")
    .select("*")
    .eq("id", id)
    .single();

  if (!reward) return NextResponse.json({ error: "獎勵不存在" }, { status: 404 });
  if (reward.status !== "pending_review") {
    return NextResponse.json({ error: "此獎勵無法發放" }, { status: 400 });
  }

  const { data: updated } = await admin
    .from("monster_rewards")
    .update({ status: "issued", issued_at: now })
    .eq("id", id)
    .select()
    .single();

  await logAudit(auth!.profile.id, "issue_monster_reward", "monster_reward", id, reward, updated);

  return NextResponse.json({ reward: updated });
}
