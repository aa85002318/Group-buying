import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_RECIPE_PAGE_SETTINGS,
  mergeRecipePageSettings,
  RECIPES_PAGE_SETTINGS_KEY,
  type RecipePageSettings,
} from "@/lib/recipes/page-settings";

export async function getRecipePageSettings(): Promise<RecipePageSettings> {
  if (!isSupabaseConfigured()) {
    return structuredClone(DEFAULT_RECIPE_PAGE_SETTINGS);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", RECIPES_PAGE_SETTINGS_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return structuredClone(DEFAULT_RECIPE_PAGE_SETTINGS);
    }

    return mergeRecipePageSettings(data.value);
  } catch {
    return structuredClone(DEFAULT_RECIPE_PAGE_SETTINGS);
  }
}

export async function saveRecipePageSettings(
  settings: RecipePageSettings,
  updatedBy?: string | null
): Promise<{ ok: true; settings: RecipePageSettings } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true, settings };
  }

  try {
    const admin = createAdminClient();
    const payload = {
      key: RECIPES_PAGE_SETTINGS_KEY,
      value: settings,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("site_settings").upsert(payload, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, settings };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "儲存失敗",
    };
  }
}
