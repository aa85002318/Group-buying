import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { DESKTOP_HOME_SECTION_DEFAULTS } from "@/lib/layout/page-layout-settings";
import { requireRole } from "@/lib/auth";
import { peekDesktopLayoutDraftRows } from "@/lib/cms/desktop-layout-versions";

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

  // Page Builder preview: editors see the saved (unpublished) desktop draft.
  if (url.searchParams.get("preview") === "draft" && platform === "desktop") {
    const { error: authError } = await requireRole(["admin", "content_editor"]);
    if (!authError) {
      const rows = await peekDesktopLayoutDraftRows(pageKey);
      return NextResponse.json({ settings: rows, preview: "draft" });
    }
    // Not an editor: fall through to the published layout.
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
