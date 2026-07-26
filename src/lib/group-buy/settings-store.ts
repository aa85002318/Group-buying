import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_GROUP_BUY_PAGE_SETTINGS,
  mergeGroupBuyPageSettings,
  type GroupBuyPageSettings,
} from "@/lib/group-buy/page-settings";

const SETTINGS_KEY = "group_buy_page";

export async function getGroupBuyPageSettings(): Promise<GroupBuyPageSettings> {
  if (!isSupabaseConfigured()) {
    return structuredClone(DEFAULT_GROUP_BUY_PAGE_SETTINGS);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return structuredClone(DEFAULT_GROUP_BUY_PAGE_SETTINGS);
    }
    return mergeGroupBuyPageSettings(data.value);
  } catch {
    return structuredClone(DEFAULT_GROUP_BUY_PAGE_SETTINGS);
  }
}

export async function saveGroupBuyPageSettings(
  settings: GroupBuyPageSettings,
  updatedBy?: string | null
): Promise<{ ok: true; settings: GroupBuyPageSettings } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true, settings };
  }

  try {
    const admin = createAdminClient();
    const payload = {
      key: SETTINGS_KEY,
      value: settings,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("site_settings").upsert(payload, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, settings };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "儲存失敗" };
  }
}
