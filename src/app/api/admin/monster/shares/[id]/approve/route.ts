import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getOrCreateMockProfile, monsterMockStore } from "@/lib/monster-mock";
import { onApproveShare } from "@/lib/services/monsterService";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MonsterProfile } from "@/lib/types/database";

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

    record.status = "approved";
    record.reviewed_by = adminId;
    record.reviewed_at = now;

    const profile = getOrCreateMockProfile(record.user_id);
    const existingRewards = monsterMockStore.rewards.filter((r) => r.user_id === record.user_id);
    const { updatedProfile, newRewards } = onApproveShare(
      profile,
      Number(record.bread_kg_awarded),
      monsterMockStore.rewardRules,
      existingRewards
    );

    monsterMockStore.profiles.set(record.user_id, updatedProfile);
    for (const reward of newRewards) {
      monsterMockStore.rewards.push({
        ...reward,
        id: `mr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: now,
        updated_at: now,
      });
    }

    return NextResponse.json({
      shareRecord: record,
      profile: updatedProfile,
      newRewards: newRewards.length,
    });
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

  const { data: updatedRecord } = await admin
    .from("product_share_records")
    .update({
      status: "approved",
      reviewed_by: adminId,
      reviewed_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  let { data: profile } = await admin
    .from("monster_profiles")
    .select("*")
    .eq("user_id", record.user_id)
    .maybeSingle();

  if (!profile) {
    const { data: created } = await admin
      .from("monster_profiles")
      .insert({
        user_id: record.user_id,
        monster_name: "麵包小怪獸",
        bread_kg: 0,
        level: 1,
        current_stage: "hungry",
      })
      .select()
      .single();
    profile = created;
  }

  const { data: rules } = await admin.from("reward_rules").select("*").eq("is_active", true);
  const { data: existingRewards } = await admin
    .from("monster_rewards")
    .select("reward_rule_id")
    .eq("user_id", record.user_id);

  const { updatedProfile, newRewards } = onApproveShare(
    profile as MonsterProfile,
    Number(record.bread_kg_awarded),
    rules ?? [],
    existingRewards ?? []
  );

  await admin
    .from("monster_profiles")
    .update({
      bread_kg: updatedProfile.bread_kg,
      level: updatedProfile.level,
      current_stage: updatedProfile.current_stage,
    })
    .eq("user_id", record.user_id);

  await admin.from("monster_feed_logs").insert({
    user_id: record.user_id,
    product_id: record.product_id,
    order_id: record.order_id,
    share_record_id: id,
    bread_kg: record.bread_kg_awarded,
    reason: "分享審核通過",
    status: "approved",
  });

  if (newRewards.length > 0) {
    await admin.from("monster_rewards").insert(newRewards);
  }

  await logAudit(adminId, "approve_monster_share", "product_share_record", id, record, updatedRecord);

  return NextResponse.json({
    shareRecord: updatedRecord,
    profile: updatedProfile,
    newRewards: newRewards.length,
  });
}
