import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";

type HeaderChip = {
  href: string;
  label: string;
  badge?: "hot" | "live";
  icon_emoji?: string;
};

const PAGE_KEY_META: Record<
  string,
  { label: string; href: string; badge?: "hot" | "live"; icon_emoji?: string }
> = {
  home: { label: "首頁", href: "/" },
  products: { label: "全部商品", href: "/products", icon_emoji: "🛍️" },
  group_buy: { label: "熱門團購", href: "/group-buy", badge: "hot", icon_emoji: "🔥" },
  live: { label: "直播專區", href: "/live", badge: "live", icon_emoji: "📡" },
  videos: { label: "影音專區", href: "/videos", icon_emoji: "🎬" },
  articles: { label: "文章專區", href: "/articles", icon_emoji: "📝" },
};

export async function GET() {
  const supabase = await createClient();

  const defaults = {
    brandTitle: BRAND_NAME,
    brandSubtitle: BRAND_SUBTITLE,
    pageKeys: ["products", "group_buy", "live", "videos", "articles"],
    categoryIds: [] as string[],
  };

  const { data: settings } = await supabase
    .from("site_header_settings")
    .select("brand_title,brand_subtitle,page_keys,category_ids")
    .eq("singleton_key", "main")
    .maybeSingle();

  const brandTitle = settings?.brand_title ?? defaults.brandTitle;
  const brandSubtitle = settings?.brand_subtitle ?? defaults.brandSubtitle;
  const pageKeys = (settings?.page_keys as unknown as string[] | null) ?? defaults.pageKeys;
  const categoryIds = (settings?.category_ids as unknown as string[] | null) ?? defaults.categoryIds;

  // categories: preserve admin-selected order by mapping id -> meta.
  const categoriesById = new Map<
    string,
    { id: string; slug: string; name: string; icon_emoji?: string | null }
  >();

  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("product_categories")
      .select("id, slug, name, icon_emoji")
      .in("id", categoryIds);

    for (const c of categories ?? []) {
      categoriesById.set(c.id, {
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon_emoji: c.icon_emoji,
      });
    }
  }

  const links: HeaderChip[] = [];

  for (const key of pageKeys) {
    const meta = PAGE_KEY_META[key];
    if (!meta) continue;
    links.push({
      href: meta.href,
      label: meta.label,
      badge: meta.badge,
      icon_emoji: meta.icon_emoji,
    });
  }

  for (const categoryId of categoryIds) {
    const c = categoriesById.get(categoryId);
    if (!c) continue;
    links.push({
      href: `/products?category=${encodeURIComponent(c.slug)}`,
      label: c.name,
      icon_emoji: c.icon_emoji ?? undefined,
    });
  }

  return NextResponse.json({
    brandTitle,
    brandSubtitle,
    links,
  });
}

