import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { DEFAULT_AI_SETTINGS, type AISettings } from "./types";

export async function getAISettings(): Promise<AISettings> {
  if (!isSupabaseConfigured()) return DEFAULT_AI_SETTINGS;
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_settings")
    .select("config")
    .eq("settings_key", "default")
    .maybeSingle();
  return {
    ...DEFAULT_AI_SETTINGS,
    ...((data?.config ?? {}) as Partial<AISettings>),
    toolLimits: {
      ...DEFAULT_AI_SETTINGS.toolLimits,
      ...((data?.config as { toolLimits?: Partial<AISettings["toolLimits"]> } | null)?.toolLimits ??
        {}),
    },
  };
}

export async function saveAISettings(
  patch: Partial<AISettings>,
  userId?: string
): Promise<AISettings> {
  const next = { ...(await getAISettings()), ...patch };
  if (!isSupabaseConfigured()) return next;
  const admin = createAdminClient();
  await admin.from("ai_settings").upsert({
    settings_key: "default",
    config: next,
    updated_by: userId ?? null,
    updated_at: new Date().toISOString(),
  });
  return next;
}
