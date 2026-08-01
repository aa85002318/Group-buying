import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  normalizeShopHeroList,
  SHOP_HERO_BANNER_TYPE,
} from "@/types/shop-hero-banner";

export const dynamic = "force-dynamic";

/** Public shop hero banners — GET /api/shop/hero-banners */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ banners: DEFAULT_SHOP_HERO_BANNERS });
  }

  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await admin
      .from("cms_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[api/shop/hero-banners]", error.message);
      return NextResponse.json({ banners: DEFAULT_SHOP_HERO_BANNERS });
    }

    const rows = (data ?? []).filter((row) => {
      const placement = String(row.placement ?? "");
      const bannerType = String(row.banner_type ?? "");
      const status = String(row.status ?? "active");
      if (status === "inactive" || status === "draft") return false;
      if (!(placement === SHOP_HERO_BANNER_TYPE || bannerType === SHOP_HERO_BANNER_TYPE)) {
        return false;
      }
      if (row.starts_at && String(row.starts_at) > nowIso) return false;
      if (row.ends_at && String(row.ends_at) < nowIso) return false;
      return true;
    });

    return NextResponse.json({ banners: normalizeShopHeroList(rows) });
  } catch (e) {
    console.error("[api/shop/hero-banners]", e);
    return NextResponse.json({ banners: DEFAULT_SHOP_HERO_BANNERS });
  }
}
