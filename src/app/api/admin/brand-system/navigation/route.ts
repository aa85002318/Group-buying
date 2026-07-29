import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireContentAdmin, logAudit } from "@/lib/auth";

export async function GET(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  const type = new URL(request.url).searchParams.get("type");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] });
  }

  const admin = createAdminClient();
  let query = admin.from("brand_navigation_items").select("*").order("sort_order");
  if (type) query = query.eq("navigation_type", type);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: body }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("brand_navigation_items")
    .insert({
      navigation_type: body.navigation_type,
      parent_id: body.parent_id ?? null,
      label: body.label,
      icon_key: body.icon_key ?? null,
      href: body.href,
      requires_auth: Boolean(body.requires_auth),
      mobile_visible: body.mobile_visible !== false,
      desktop_visible: body.desktop_visible !== false,
      sort_order: Number(body.sort_order ?? 0),
      enabled: body.enabled !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "create",
    "brand_navigation_items",
    data.id,
    null,
    data,
    request as never
  );
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: body });
  }

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("brand_navigation_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  for (const key of [
    "label",
    "icon_key",
    "href",
    "requires_auth",
    "mobile_visible",
    "desktop_visible",
    "sort_order",
    "enabled",
    "navigation_type",
    "parent_id",
  ]) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await admin
    .from("brand_navigation_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("brand_versions").insert({
    resource_type: "brand_navigation_items",
    resource_id: id,
    before_data: old,
    after_data: data,
    action: "update",
    created_by: auth!.profile.id,
  });

  await logAudit(
    auth!.profile.id,
    "update",
    "brand_navigation_items",
    id,
    old,
    data,
    request as never
  );
  return NextResponse.json({ item: data });
}
