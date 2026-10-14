import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HOME_LAYOUT_SETTINGS,
  HOME_LAYOUT_SETTING_KEY,
  normalizeHomeLayoutSettings,
} from "@/lib/home/layout-device";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_HOME_LAYOUT_SETTINGS });
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("value, updated_at")
    .eq("key", HOME_LAYOUT_SETTING_KEY)
    .maybeSingle();
  return NextResponse.json({
    settings: data?.value
      ? normalizeHomeLayoutSettings(data.value)
      : DEFAULT_HOME_LAYOUT_SETTINGS,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const settings = normalizeHomeLayoutSettings(body.settings ?? body);
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, settings });

  const admin = createAdminClient();
  const { error: upsertError } = await admin.from("site_settings").upsert(
    {
      key: HOME_LAYOUT_SETTING_KEY,
      value: settings,
      updated_by: auth?.profile?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }
  await logAudit(
    auth!.profile.id,
    "update",
    "home_layout_settings",
    HOME_LAYOUT_SETTING_KEY,
    null,
    settings,
    request as never
  );
  return NextResponse.json({ ok: true, settings });
}
