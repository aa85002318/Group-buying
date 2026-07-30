import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBrandHeroFallback } from "@/lib/brand-system/hero-defaults";
import type { BrandHeroData, BrandHeroTag } from "@/components/brand/hero/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isLive(row: {
  enabled: boolean;
  status: string;
  start_at: string | null;
  end_at: string | null;
}) {
  if (!row.enabled || row.status !== "published") return false;
  const now = Date.now();
  if (row.start_at && new Date(row.start_at).getTime() > now) return false;
  if (row.end_at && new Date(row.end_at).getTime() < now) return false;
  return true;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;
  const fallback = resolveBrandHeroFallback(key);

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { hero: fallback, source: "fallback" },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("brand_heroes")
      .select("*")
      .eq("hero_key", key)
      .maybeSingle();

    if (error || !row || !isLive(row)) {
      return NextResponse.json(
        { hero: fallback, source: "fallback" },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const { data: tags } = await admin
      .from("brand_hero_tags")
      .select("*")
      .eq("hero_id", row.id)
      .eq("enabled", true)
      .order("sort_order");

    const mappedTags = ((tags ?? []) as Array<Record<string, unknown>>).map(
      (t): BrandHeroTag => ({
        id: String(t.id),
        label: String(t.label),
        keyword: t.keyword ? String(t.keyword) : null,
        linkType: t.link_type === "url" ? "url" : "search",
        targetUrl: t.target_url ? String(t.target_url) : null,
        enabled: t.enabled !== false,
        sortOrder: Number(t.sort_order ?? 0),
      })
    );

    const desktopImageUrl =
      row.desktop_image_url || fallback.desktopImageUrl || null;
    const mobileImageUrl =
      row.mobile_image_url || fallback.mobileImageUrl || null;
    const usingBundledHomeArt =
      key === "home" &&
      (!row.desktop_image_url ||
        row.desktop_image_url === fallback.desktopImageUrl);

    // Prefer V2 chips when CMS still has legacy seed tags
    const legacyLabels = new Set([
      "麵粉",
      "奶油",
      "巧克力",
      "草莓蛋糕",
      "司康",
      "生乳捲",
      "巧克力餅乾",
      "可頌",
    ]);
    const tagsLookLegacy =
      mappedTags.length > 0 &&
      mappedTags.every((t) => {
        const bare = t.label.replace(/^[^A-Za-z0-9\u4e00-\u9fff]+/, "").trim();
        return legacyLabels.has(t.label) || legacyLabels.has(bare);
      });
    const resolvedTags =
      key === "home" && (mappedTags.length === 0 || tagsLookLegacy)
        ? fallback.tags ?? mappedTags
        : mappedTags.length
          ? mappedTags
          : fallback.tags ?? [];

    const hero: BrandHeroData = {
      heroKey: row.hero_key,
      name: row.name,
      title: row.title || fallback.title,
      subtitle: row.subtitle ?? fallback.subtitle,
      capsuleLabel: usingBundledHomeArt
        ? null
        : ((row as { capsule_label?: string | null }).capsule_label ??
          fallback.capsuleLabel ??
          null),
      showTitle: usingBundledHomeArt ? false : row.show_title !== false,
      showSubtitle: usingBundledHomeArt ? false : row.show_subtitle !== false,
      showCtas: usingBundledHomeArt
        ? false
        : (row as { show_ctas?: boolean }).show_ctas === true,
      primaryCtaLabel:
        (row as { primary_cta_label?: string | null }).primary_cta_label ??
        fallback.primaryCtaLabel ??
        null,
      primaryCtaHref:
        (row as { primary_cta_href?: string | null }).primary_cta_href ??
        fallback.primaryCtaHref ??
        null,
      secondaryCtaLabel:
        (row as { secondary_cta_label?: string | null }).secondary_cta_label ??
        fallback.secondaryCtaLabel ??
        null,
      secondaryCtaHref:
        (row as { secondary_cta_href?: string | null }).secondary_cta_href ??
        fallback.secondaryCtaHref ??
        null,
      desktopImageUrl,
      mobileImageUrl,
      imageAlt: row.image_alt ?? fallback.imageAlt,
      imagePosition: (row.image_position as "left" | "center" | "right") ?? "center",
      searchPlaceholder: row.search_placeholder || fallback.searchPlaceholder,
      searchScope: row.search_scope || fallback.searchScope,
      showPopularTags: row.show_popular_tags !== false,
      enabled: row.enabled,
      tags: resolvedTags,
    };

    return NextResponse.json(
      { hero, source: "cms" },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      { hero: fallback, source: "fallback" },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
