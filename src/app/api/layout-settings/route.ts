import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { DESKTOP_HOME_SECTION_DEFAULTS } from "@/lib/layout/page-layout-settings";

/** Public read — desktop/mobile layout settings only (no product content). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageKey = url.searchParams.get("page_key") ?? "home";
  const platform = url.searchParams.get("platform") ?? "desktop";

  if (!isSupabaseConfigured()) {
    if (platform === "desktop" && pageKey === "home") {
      return NextResponse.json({
        settings: DESKTOP_HOME_SECTION_DEFAULTS.map((s, i) => ({
          id: `local-${i}`,
          page_key: "home",
          platform: "desktop",
          ...s,
          enabled: true,
        })),
      });
    }
    return NextResponse.json({ settings: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("page_layout_settings")
    .select("*")
    .eq("page_key", pageKey)
    .eq("platform", platform)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? [] });
}
