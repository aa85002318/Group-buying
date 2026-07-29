import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBrandHeroFallback } from "@/lib/brand-system/hero-defaults";
import type { BrandHeroData, BrandHeroTag } from "@/components/brand/hero/types";

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
    return NextResponse.json({ hero: fallback, source: "fallback" });
  }

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("brand_heroes")
      .select("*")
      .eq("hero_key", key)
      .maybeSingle();

    if (error || !row || !isLive(row)) {
      return NextResponse.json({ hero: fallback, source: "fallback" });
    }

    const { data: tags } = await admin
      .from("brand_hero_tags")
      .select("*")
      .eq("hero_id", row.id)
      .eq("enabled", true)
      .order("sort_order");

    const hero: BrandHeroData = {
      heroKey: row.hero_key,
      name: row.name,
      title: row.title || fallback.title,
      subtitle: row.subtitle,
      showTitle: row.show_title !== false,
      showSubtitle: row.show_subtitle !== false,
      desktopImageUrl: row.desktop_image_url,
      mobileImageUrl: row.mobile_image_url,
      imageAlt: row.image_alt,
      imagePosition: (row.image_position as "left" | "center" | "right") ?? "center",
      searchPlaceholder: row.search_placeholder,
      searchScope: row.search_scope,
      showPopularTags: row.show_popular_tags !== false,
      enabled: row.enabled,
      tags: ((tags ?? []) as Array<Record<string, unknown>>).map(
        (t): BrandHeroTag => ({
          id: String(t.id),
          label: String(t.label),
          keyword: t.keyword ? String(t.keyword) : null,
          linkType: t.link_type === "url" ? "url" : "search",
          targetUrl: t.target_url ? String(t.target_url) : null,
          enabled: t.enabled !== false,
          sortOrder: Number(t.sort_order ?? 0),
        })
      ),
    };

    return NextResponse.json({ hero, source: "cms" });
  } catch {
    return NextResponse.json({ hero: fallback, source: "fallback" });
  }
}
