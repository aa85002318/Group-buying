import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_HOME_SETTINGS,
  DEFAULT_SHOP_POPULAR_KEYWORDS,
  parseShopHomeSettings,
  parseShopPopularKeywords,
} from "@/lib/shop/home-settings";

export const dynamic = "force-dynamic";

/** GET /api/shop/home-settings — public welcome CMS + active keywords */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      settings: DEFAULT_SHOP_HOME_SETTINGS,
      keywords: DEFAULT_SHOP_POPULAR_KEYWORDS.filter((k) => k.is_active).slice(0, 5),
    });
  }

  try {
    const supabase = await createClient();
    const [{ data: settingsRow }, { data: keywordRows }] = await Promise.all([
      supabase.from("shop_home_settings").select("*").eq("singleton_key", "main").maybeSingle(),
      supabase
        .from("shop_popular_keywords")
        .select("id, keyword, url, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(5),
    ]);

    return NextResponse.json({
      settings: parseShopHomeSettings((settingsRow as Record<string, unknown>) ?? undefined),
      keywords: parseShopPopularKeywords(keywordRows).slice(0, 5),
    });
  } catch {
    return NextResponse.json({
      settings: DEFAULT_SHOP_HOME_SETTINGS,
      keywords: DEFAULT_SHOP_POPULAR_KEYWORDS.filter((k) => k.is_active).slice(0, 5),
    });
  }
}
