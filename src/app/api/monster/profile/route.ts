import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getOrCreateMockProfile } from "@/lib/monster-mock";
import { getMonsterStage } from "@/lib/services/monsterService";
import { createClient } from "@/lib/supabase/server";
import type { MonsterProfile } from "@/lib/types/database";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;
  const userId = auth!.profile.id;

  if (!isSupabaseConfigured()) {
    const profile = getOrCreateMockProfile(userId);
    return NextResponse.json({ profile });
  }

  const supabase = await createClient();
  let { data: profile } = await supabase
    .from("monster_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    const { data: created, error: createError } = await supabase
      .from("monster_profiles")
      .insert({
        user_id: userId,
        monster_name: "麵包小怪獸",
        bread_kg: 0,
        level: 1,
        current_stage: getMonsterStage(0),
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    profile = created;
  }

  return NextResponse.json({ profile: profile as MonsterProfile });
}
