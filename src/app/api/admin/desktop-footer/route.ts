import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_DESKTOP_FOOTER_SETTINGS,
  normalizeDesktopFooterSettings,
} from "@/lib/desktop/footer-settings";
import { createAdminClient } from "@/lib/supabase/admin";

async function ensureFooterRow(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin
    .from("page_layout_settings")
    .select("*")
    .eq("page_key", "global")
    .eq("platform", "desktop")
    .eq("section_key", "footer")
    .maybeSingle();
  if (data) return data;

  const { data: created } = await admin
    .from("page_layout_settings")
    .insert({
      page_key: "global",
      platform: "desktop",
      section_key: "footer",
      enabled: true,
      sort_order: 1,
      layout_type: "footer",
      settings_json: DEFAULT_DESKTOP_FOOTER_SETTINGS,
    })
    .select("*")
    .single();
  return created;
}

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_DESKTOP_FOOTER_SETTINGS });
  }

  const admin = createAdminClient();
  const row = await ensureFooterRow(admin);
  return NextResponse.json({
    id: row?.id ?? null,
    settings: normalizeDesktopFooterSettings(row?.settings_json),
  });
}

export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const settings = normalizeDesktopFooterSettings(body.settings ?? body);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, settings });
  }

  const admin = createAdminClient();
  const row = await ensureFooterRow(admin);
  if (!row?.id) {
    return NextResponse.json({ error: "無法建立 Footer 設定" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("page_layout_settings")
    .update({ settings_json: settings, enabled: true })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "desktop_footer.update",
    "page_layout_settings",
    row.id,
    null,
    settings
  );

  return NextResponse.json({
    ok: true,
    settings: normalizeDesktopFooterSettings(data?.settings_json),
  });
}
