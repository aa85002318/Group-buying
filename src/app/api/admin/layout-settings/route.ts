import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { DESKTOP_HOME_SECTION_DEFAULTS } from "@/lib/layout/page-layout-settings";

export async function GET(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const pageKey = url.searchParams.get("page_key") ?? "home";
  const platform = url.searchParams.get("platform") ?? "desktop";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      settings: DESKTOP_HOME_SECTION_DEFAULTS.map((s, i) => ({
        id: `local-${i}`,
        page_key: pageKey,
        platform,
        enabled: true,
        ...s,
      })),
    });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("page_layout_settings")
    .select("*")
    .eq("page_key", pageKey)
    .eq("platform", platform)
    .order("sort_order", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? [] });
}

export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [body];

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, items });
  }

  const admin = createAdminClient();
  const updated = [];

  for (const item of items) {
    if (!item.id) continue;
    const patch: Record<string, unknown> = {};
    if (typeof item.enabled === "boolean") patch.enabled = item.enabled;
    if (typeof item.sort_order === "number") patch.sort_order = item.sort_order;
    if (typeof item.layout_type === "string") patch.layout_type = item.layout_type;
    if (typeof item.columns === "number" || item.columns === null) patch.columns = item.columns;
    if (typeof item.display_limit === "number" || item.display_limit === null) {
      patch.display_limit = item.display_limit;
    }
    if (item.settings_json && typeof item.settings_json === "object") {
      patch.settings_json = item.settings_json;
    }

    const { data, error } = await admin
      .from("page_layout_settings")
      .update(patch)
      .eq("id", item.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    updated.push(data);
  }

await logAudit(
    auth!.profile.id,
    "page_layout_settings.update",
    "page_layout_settings",
    updated.map((u) => u?.id).filter(Boolean).join(",") || null,
    null,
    { count: updated.length }
  );

  return NextResponse.json({ ok: true, settings: updated });
}
