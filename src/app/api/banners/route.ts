import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  normalizeShopHeroList,
  SHOP_HERO_BANNER_TYPE,
} from "@/types/shop-hero-banner";

export const dynamic = "force-dynamic";

/** Public banners — GET /api/banners?type=shop_hero */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || SHOP_HERO_BANNER_TYPE).trim();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      banners: type === SHOP_HERO_BANNER_TYPE ? DEFAULT_SHOP_HERO_BANNERS : [],
    });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cms_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[api/banners]", error.message);
      return NextResponse.json({
        banners: type === SHOP_HERO_BANNER_TYPE ? DEFAULT_SHOP_HERO_BANNERS : [],
      });
    }

    const rows = (data ?? []).filter((row) => {
      const placement = String(row.placement ?? "");
      const bannerType = String(row.banner_type ?? "");
      const status = String(row.status ?? "active");
      if (status === "inactive" || status === "draft") return false;
      return placement === type || bannerType === type;
    });

    return NextResponse.json({ banners: normalizeShopHeroList(rows) });
  } catch (e) {
    console.error("[api/banners]", e);
    return NextResponse.json({
      banners: type === SHOP_HERO_BANNER_TYPE ? DEFAULT_SHOP_HERO_BANNERS : [],
    });
  }
}
