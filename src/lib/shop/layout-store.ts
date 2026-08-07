import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_LAYOUT,
  mergeShopLayoutSettings,
  type ShopLayoutSettings,
} from "@/lib/shop/layout-settings";
import { parseShopPageSettings } from "@/lib/shop/page-settings";

const LIVE_KEY = "shop_layout";

async function loadAppearanceFromTable(): Promise<ShopLayoutSettings["appearance"]> {
  if (!isSupabaseConfigured()) return DEFAULT_SHOP_LAYOUT.appearance;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("shop_page_settings")
      .select("*")
      .eq("singleton_key", "main")
      .maybeSingle();
    return parseShopPageSettings((data as Record<string, unknown>) ?? undefined);
  } catch {
    return DEFAULT_SHOP_LAYOUT.appearance;
  }
}

export async function getShopLayoutSettings(): Promise<ShopLayoutSettings> {
  if (!isSupabaseConfigured()) {
    return structuredClone(DEFAULT_SHOP_LAYOUT);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", LIVE_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      const appearance = await loadAppearanceFromTable();
      return mergeShopLayoutSettings({ ...DEFAULT_SHOP_LAYOUT, appearance });
    }
    return mergeShopLayoutSettings(data.value);
  } catch {
    return structuredClone(DEFAULT_SHOP_LAYOUT);
  }
}

export async function saveShopLayoutSettings(
  settings: ShopLayoutSettings,
  updatedBy?: string | null
): Promise<{ ok: true; settings: ShopLayoutSettings } | { ok: false; error: string }> {
  const next = mergeShopLayoutSettings(settings);

  if (!isSupabaseConfigured()) {
    return { ok: true, settings: next };
  }

  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await admin.from("site_settings").upsert(
      {
        key: LIVE_KEY,
        value: next,
        updated_by: updatedBy ?? null,
        updated_at: now,
      },
      { onConflict: "key" }
    );
    if (error) return { ok: false, error: error.message };

    // Keep appearance table in sync for existing /api/shop/page-settings consumers
    const { error: appearanceError } = await admin.from("shop_page_settings").upsert(
      {
        singleton_key: "main",
        header_bg_color: next.appearance.header_bg_color,
        hero_bg_color: next.appearance.hero_bg_color,
        header_border_color: next.appearance.header_border_color,
        updated_at: now,
      },
      { onConflict: "singleton_key" }
    );
    if (appearanceError) {
      // Soft-fail appearance table if missing columns / table
      console.warn("[shop layout] appearance sync:", appearanceError.message);
    }

    return { ok: true, settings: next };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "儲存失敗" };
  }
}
