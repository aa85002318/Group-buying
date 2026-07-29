import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IngredientCategoriesBlock, IngredientCategoryItem } from "@/components/home/HomeIngredientCategories";

const FALLBACK_BLOCK: IngredientCategoriesBlock = {
  title: "找材料",
  subtitle: null,
  viewAllLabel: "查看全部",
  viewAllHref: "/products",
  desktopCols: 10,
  mobileCols: 5,
  items: [],
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ block: FALLBACK_BLOCK, source: "fallback" });
  }

  try {
    const admin = createAdminClient();

    /* Block-level settings stored in homepage_blocks */
    const { data: blockRow } = await admin
      .from("homepage_blocks")
      .select("*")
      .eq("block_key", "ingredient_categories")
      .maybeSingle();

    const cfg = (blockRow?.config as Record<string, unknown>) ?? {};

    /* Individual category items */
    const now = new Date().toISOString();
    const { data: rows, error } = await admin
      .from("home_ingredient_categories")
      .select("*")
      .eq("enabled", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("sort_order");

    if (error) throw error;

    const items: IngredientCategoryItem[] = (rows ?? []).map((r) => ({
      id: String(r.id),
      displayName: String(r.display_name),
      desktopIcon: r.desktop_icon ?? null,
      mobileIcon: r.mobile_icon ?? null,
      alt: r.alt ?? null,
      categoryId: r.category_id ?? null,
      customUrl: r.custom_url ?? null,
      sortOrder: Number(r.sort_order ?? 0),
      enabled: Boolean(r.enabled),
      badge: (r.badge as IngredientCategoryItem["badge"]) ?? null,
      iconMode: (r.icon_mode as IngredientCategoryItem["iconMode"]) ?? "ip",
    }));

    const block: IngredientCategoriesBlock = {
      title: String(cfg.title ?? blockRow?.title ?? "找材料"),
      subtitle: typeof cfg.subtitle === "string" ? cfg.subtitle : null,
      viewAllLabel: typeof cfg.view_all_label === "string" ? cfg.view_all_label : "查看全部",
      viewAllHref: typeof cfg.view_all_href === "string" ? cfg.view_all_href : "/products",
      desktopCols: Number(cfg.desktop_cols ?? 10),
      mobileCols: Number(cfg.mobile_cols ?? 5),
      items,
    };

    return NextResponse.json({ block, source: "cms" });
  } catch {
    return NextResponse.json({ block: FALLBACK_BLOCK, source: "fallback" });
  }
}
