import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_HERO_DEFAULTS } from "@/lib/brand-system/hero-defaults";

export async function GET() {
  const base = {
    heroes: Object.values(BRAND_HERO_DEFAULTS).map((h) => ({
      heroKey: h.heroKey,
      title: h.title,
    })),
    branding: {
      name: "CHIMEIDIY",
      tagline: "Baking Lifestyle Platform",
    },
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ...base, source: "fallback" });
  }

  try {
    const admin = createAdminClient();
    const { data: heroes } = await admin
      .from("brand_heroes")
      .select("hero_key, title, status, enabled")
      .eq("enabled", true)
      .eq("status", "published");

    return NextResponse.json({
      heroes: (heroes ?? []).map((h) => ({
        heroKey: h.hero_key,
        title: h.title,
      })),
      branding: base.branding,
      source: "cms",
    });
  } catch {
    return NextResponse.json({ ...base, source: "fallback" });
  }
}
