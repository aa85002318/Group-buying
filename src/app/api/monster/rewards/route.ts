import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { monsterMockStore } from "@/lib/monster-mock";
import { getNextRewardThreshold } from "@/lib/services/monsterService";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;
  const userId = auth!.profile.id;

  if (!isSupabaseConfigured()) {
    const rewards = monsterMockStore.rewards.filter((r) => r.user_id === userId);
    const profile = monsterMockStore.profiles.get(userId);
    const nextThreshold = profile
      ? getNextRewardThreshold(profile.bread_kg, monsterMockStore.rewardRules)
      : null;
    return NextResponse.json({ rewards, nextThreshold });
  }

  const supabase = await createClient();
  const [{ data: rewards }, { data: profile }, { data: rules }] = await Promise.all([
    supabase
      .from("monster_rewards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("monster_profiles").select("bread_kg").eq("user_id", userId).maybeSingle(),
    supabase.from("reward_rules").select("threshold_kg, is_active").eq("is_active", true),
  ]);

  const nextThreshold = profile
    ? getNextRewardThreshold(Number(profile.bread_kg), rules ?? [])
    : null;

  return NextResponse.json({ rewards: rewards ?? [], nextThreshold });
}
