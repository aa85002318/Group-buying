import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { monsterMockStore } from "@/lib/monster-mock";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!isSupabaseConfigured()) {
    let rewards = [...monsterMockStore.rewards];
    if (status) rewards = rewards.filter((r) => r.status === status);
    return NextResponse.json({ rewards: rewards.reverse() });
  }

  const admin = createAdminClient();
  let query = admin
    .from("monster_rewards")
    .select("*, profiles(full_name, member_code)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  return NextResponse.json({ rewards: data ?? [] });
}
