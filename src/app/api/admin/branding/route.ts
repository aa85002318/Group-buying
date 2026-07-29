import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { DEFAULT_BRANDING, mergeBrandingSettings } from "@/lib/branding";

const SETTINGS_KEY = "branding";

export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ branding: DEFAULT_BRANDING });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    branding: mergeBrandingSettings(data?.value ?? DEFAULT_BRANDING),
  });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const branding = mergeBrandingSettings(body);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ branding });
  }

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("site_settings")
    .select("*")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  const { error } = await admin.from("site_settings").upsert(
    {
      key: SETTINGS_KEY,
      value: branding,
      updated_by: auth!.profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "update",
    "site_settings",
    SETTINGS_KEY,
    old,
    branding,
    request as never
  );
  return NextResponse.json({ branding });
}
