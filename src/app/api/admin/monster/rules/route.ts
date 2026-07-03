import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { monsterMockStore } from "@/lib/monster-mock";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      rewardRules: monsterMockStore.rewardRules,
      gameSettings: monsterMockStore.gameSettings,
    });
  }

  const admin = createAdminClient();
  const [{ data: rewardRules }, { data: gameSettings }] = await Promise.all([
    admin.from("reward_rules").select("*").order("threshold_kg"),
    admin.from("monster_game_settings").select("*").limit(1).maybeSingle(),
  ]);

  return NextResponse.json({ rewardRules: rewardRules ?? [], gameSettings });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { rewardRules, gameSettings } = body as {
    rewardRules?: Array<{
      id: string;
      threshold_kg?: number;
      reward_type?: string;
      reward_name?: string;
      reward_value?: string | null;
      is_active?: boolean;
    }>;
    gameSettings?: {
      share_kg?: number;
      min_chars?: number;
      bonus_chars?: number;
      bonus_kg?: number;
      photo_kg?: number;
      daily_limit?: number;
    };
  };

  if (!isSupabaseConfigured()) {
    if (rewardRules) {
      for (const rule of rewardRules) {
        const idx = monsterMockStore.rewardRules.findIndex((r) => r.id === rule.id);
        if (idx >= 0) {
          monsterMockStore.rewardRules[idx] = {
            ...monsterMockStore.rewardRules[idx],
            ...rule,
            updated_at: new Date().toISOString(),
          };
        }
      }
    }
    if (gameSettings) {
      monsterMockStore.gameSettings = {
        ...monsterMockStore.gameSettings,
        ...gameSettings,
        updated_at: new Date().toISOString(),
      };
    }
    return NextResponse.json({
      rewardRules: monsterMockStore.rewardRules,
      gameSettings: monsterMockStore.gameSettings,
    });
  }

  const admin = createAdminClient();

  if (rewardRules) {
    for (const rule of rewardRules) {
      const { id, ...updates } = rule;
      await admin.from("reward_rules").update(updates).eq("id", id);
    }
  }

  if (gameSettings) {
    const { data: existing } = await admin
      .from("monster_game_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      await admin.from("monster_game_settings").update(gameSettings).eq("id", existing.id);
    } else {
      await admin.from("monster_game_settings").insert(gameSettings);
    }
  }

  const [{ data: updatedRules }, { data: updatedSettings }] = await Promise.all([
    admin.from("reward_rules").select("*").order("threshold_kg"),
    admin.from("monster_game_settings").select("*").limit(1).maybeSingle(),
  ]);

  return NextResponse.json({
    rewardRules: updatedRules ?? [],
    gameSettings: updatedSettings,
  });
}
