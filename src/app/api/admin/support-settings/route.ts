import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeLinkUrl } from "@/lib/cms/safeHtml";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: null });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("support_settings")
    .select("*")
    .eq("settings_key", "default")
    .maybeSingle();

  if (fetchError) {
    if (fetchError.code === "42P01") return NextResponse.json({ settings: null });
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  for (const key of ["line_url", "facebook_url", "instagram_url", "google_map_url"] as const) {
    if (body[key] && !isSafeLinkUrl(body[key])) {
      return NextResponse.json({ error: `${key} 連結不合法` }, { status: 400 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: body });
  }

  const admin = createAdminClient();
  const updates = {
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    line_url: body.line_url?.trim() || null,
    facebook_url: body.facebook_url?.trim() || null,
    instagram_url: body.instagram_url?.trim() || null,
    address: body.address?.trim() || null,
    business_hours: body.business_hours?.trim() || null,
    google_map_url: body.google_map_url?.trim() || null,
    returns_info: body.returns_info?.trim() || null,
    shipping_info: body.shipping_info?.trim() || null,
    support_info: body.support_info?.trim() || null,
    updated_by: auth!.profile.id,
  };

  const { data: existing } = await admin
    .from("support_settings")
    .select("id")
    .eq("settings_key", "default")
    .maybeSingle();

  let data;
  if (existing) {
    const res = await admin
      .from("support_settings")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    data = res.data;
  } else {
    const res = await admin
      .from("support_settings")
      .insert({ settings_key: "default", ...updates })
      .select()
      .single();
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    data = res.data;
  }

  await logAudit(auth!.profile.id, "update", "support_settings", data.id, existing, data, request as never);
  return NextResponse.json({ settings: data });
}
