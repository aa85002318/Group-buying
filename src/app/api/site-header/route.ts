import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import {
  DEFAULT_HEADER_NAV_ITEMS,
  DEFAULT_HEADER_PROMO_ITEMS,
  DEFAULT_SIDE_MENU_SECTIONS,
  normalizeHeaderNavItems,
  normalizeHeaderPromoItems,
  normalizeSideMenuSections,
  type HeaderNavItem,
} from "@/lib/site-header";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      brandTitle: BRAND_NAME,
      brandSubtitle: BRAND_SUBTITLE,
      links: DEFAULT_HEADER_NAV_ITEMS,
      promoItems: DEFAULT_HEADER_PROMO_ITEMS,
      sideMenuSections: DEFAULT_SIDE_MENU_SECTIONS,
    });
  }

  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from("site_header_settings")
    .select(
      "brand_title,brand_subtitle,nav_items,promo_items,side_menu_sections,page_keys,category_ids"
    )
    .eq("singleton_key", "main")
    .maybeSingle();

  const brandTitle = settings?.brand_title ?? BRAND_NAME;
  const brandSubtitle = settings?.brand_subtitle ?? BRAND_SUBTITLE;

  let navItems = normalizeHeaderNavItems(settings?.nav_items);

  // Backward compatibility: if nav_items empty, fall back to page_keys + categories
  if (navItems.length === 0) {
    const pageKeys = (settings?.page_keys as unknown as string[] | null) ?? [];
    const categoryIds = (settings?.category_ids as unknown as string[] | null) ?? [];
    const fallback: HeaderNavItem[] = [];

    const pageMeta: Record<string, HeaderNavItem> = Object.fromEntries(
      DEFAULT_HEADER_NAV_ITEMS.map((item) => [item.id, item])
    );
    pageMeta.home = { id: "home", label: "首頁", href: "/" };

    for (const key of pageKeys) {
      if (pageMeta[key]) fallback.push(pageMeta[key]);
    }

    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from("product_categories")
        .select("id, slug, name, icon_emoji")
        .in("id", categoryIds);

      const byId = new Map((categories ?? []).map((c) => [c.id, c]));
      for (const id of categoryIds) {
        const c = byId.get(id);
        if (!c) continue;
        fallback.push({
          id: `category-${c.id}`,
          label: c.name,
          href: `/products?category=${encodeURIComponent(c.slug)}`,
          icon_emoji: c.icon_emoji ?? undefined,
        });
      }
    }

    navItems = fallback.length > 0 ? fallback : DEFAULT_HEADER_NAV_ITEMS;
  }

  const promoItems = normalizeHeaderPromoItems(settings?.promo_items);
  const sideMenuSections = normalizeSideMenuSections(settings?.side_menu_sections);

  return NextResponse.json({
    brandTitle,
    brandSubtitle,
    links: navItems.map((item) => ({
      href: item.href,
      label: item.label,
      badge: item.badge,
      icon_emoji: item.icon_emoji,
    })),
    promoItems: Array.isArray(settings?.promo_items)
      ? promoItems
      : DEFAULT_HEADER_PROMO_ITEMS,
    sideMenuSections:
      sideMenuSections.length > 0 ? sideMenuSections : DEFAULT_SIDE_MENU_SECTIONS,
  });
}
