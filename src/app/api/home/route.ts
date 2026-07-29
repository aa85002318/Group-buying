import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOrderedHomeSections } from "@/lib/home/blocks";
import { PRIMARY_HOME_SECTION_KEYS } from "@/lib/home/section-keys";
import { resolveBrandHeroFallback } from "@/lib/brand-system/hero-defaults";
import { parseStoreNewsCards } from "@/lib/home/store-news";
import { parseServiceShortcuts } from "@/lib/home/service-shortcuts";
import { parsePopularCategories } from "@/lib/home/admin-sections";
import type { HomepageBlock } from "@/lib/types/database";

function findBlock(blocks: HomepageBlock[], key: string) {
  return blocks.find((b) => b.block_key === key);
}

export async function GET(request: Request) {
  const preview = new URL(request.url).searchParams.get("preview") === "draft";
  const layout = PRIMARY_HOME_SECTION_KEYS;
  const heroFallback = resolveBrandHeroFallback("home");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      layout,
      hero: heroFallback,
      storeNews: parseStoreNewsCards(null),
      serviceShortcuts: parseServiceShortcuts(null),
      source: "fallback",
    });
  }

  try {
    const admin = createAdminClient();
    const cmsUrl = preview ? "/api/cms?preview=draft" : "/api/cms";
    void cmsUrl;

    const { data: blocks } = await admin
      .from("homepage_blocks")
      .select("*")
      .order("sort_order");

    const ordered = listOrderedHomeSections(blocks ?? []);
    const resolvedLayout = ordered.map((b) => b.key);

    const { data: heroRow } = await admin
      .from("brand_heroes")
      .select("*")
      .eq("hero_key", "home")
      .maybeSingle();

    const storeBlock = findBlock(blocks ?? [], "store_news");
    const svcBlock = findBlock(blocks ?? [], "service_shortcuts");

    return NextResponse.json({
      layout: resolvedLayout.length ? resolvedLayout : layout,
      hero: heroRow
        ? {
            title: heroRow.title,
            subtitle: heroRow.subtitle,
            searchPlaceholder: heroRow.search_placeholder,
          }
        : heroFallback,
      storeNews: parseStoreNewsCards(
        (storeBlock?.config as Record<string, unknown>) ?? null
      ),
      ingredientCategories: parsePopularCategories(
        (findBlock(blocks ?? [], "popular_categories")?.config as Record<string, unknown>) ??
          null
      ),
      serviceShortcuts: parseServiceShortcuts(
        (svcBlock?.config as Record<string, unknown>) ?? null
      ),
      source: "cms",
    });
  } catch {
    return NextResponse.json({
      layout,
      hero: heroFallback,
      storeNews: parseStoreNewsCards(null),
      serviceShortcuts: parseServiceShortcuts(null),
      source: "fallback",
    });
  }
}
