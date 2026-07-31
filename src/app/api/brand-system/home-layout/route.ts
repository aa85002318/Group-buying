import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_SECTIONS = [
  { sectionKey: "hero", title: "Brand Hero", sortOrder: 10, enabled: true },
  {
    sectionKey: "latest_recipes",
    title: "本週熱門食譜",
    subtitle: "從靈感開始，找到今天想做的甜點",
    moreHref: "/recipes",
    sortOrder: 20,
    enabled: true,
  },
  {
    sectionKey: "recipe_kits",
    title: "一鍵購買材料",
    moreHref: "/recipes",
    sortOrder: 30,
    enabled: true,
  },
  {
    sectionKey: "popular_categories",
    title: "找材料",
    moreHref: "/shop/categories",
    sortOrder: 40,
    enabled: true,
  },
  {
    sectionKey: "popular_baking_products",
    title: "本週熱賣",
    moreHref: "/shop/categories",
    sortOrder: 50,
    enabled: true,
  },
  {
    sectionKey: "featured_courses",
    title: "最新課程",
    moreHref: "/courses",
    sortOrder: 60,
    enabled: true,
  },
  {
    sectionKey: "closing_group_buys",
    title: "團購優惠",
    moreHref: "/group-buy",
    sortOrder: 70,
    enabled: true,
  },
  {
    sectionKey: "latest_videos",
    title: "最新影音",
    moreHref: "/videos",
    sortOrder: 80,
    enabled: true,
  },
  { sectionKey: "trust_services", title: "安心服務", sortOrder: 90, enabled: true },
  {
    sectionKey: "community",
    title: "社群入口",
    moreHref: "/community",
    sortOrder: 100,
    enabled: true,
  },
];

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sections: DEFAULT_SECTIONS, source: "fallback" });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("brand_home_sections")
      .select("*")
      .eq("enabled", true)
      .order("sort_order");

    if (error) throw error;

    const sections = (data ?? []).map((row) => ({
      id: row.id,
      sectionKey: row.section_key,
      title: row.title,
      subtitle: row.subtitle,
      moreLabel: row.more_label,
      moreHref: row.more_href,
      mobileVisible: row.mobile_visible,
      desktopVisible: row.desktop_visible,
      sortOrder: row.sort_order,
      enabled: row.enabled,
      settings: row.settings,
    }));

    return NextResponse.json({
      sections: sections.length ? sections : DEFAULT_SECTIONS,
      source: sections.length ? "cms" : "fallback",
    });
  } catch {
    return NextResponse.json({ sections: DEFAULT_SECTIONS, source: "fallback" });
  }
}
