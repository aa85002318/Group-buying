import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ heroes: [] });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("brand_heroes")
    .select("*, brand_hero_tags(*)")
    .order("hero_key");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ heroes: data ?? [] });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ hero: body }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("brand_heroes")
    .insert({
      hero_key: body.hero_key,
      name: body.name,
      title: body.title,
      subtitle: body.subtitle ?? null,
      desktop_image_url: body.desktop_image_url ?? null,
      mobile_image_url: body.mobile_image_url ?? null,
      image_alt: body.image_alt ?? null,
      search_placeholder: body.search_placeholder ?? null,
      search_scope: body.search_scope ?? "global",
      enabled: body.enabled !== false,
      status: body.status ?? "draft",
      start_at: body.start_at ?? null,
      end_at: body.end_at ?? null,
      created_by: auth!.profile.id,
      updated_by: auth!.profile.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "brand_heroes", data.id, null, data, request as never);
  return NextResponse.json({ hero: data }, { status: 201 });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ hero: body });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("brand_heroes").select("*").eq("id", id).maybeSingle();

  const updates: Record<string, unknown> = {
    updated_by: auth!.profile.id,
    updated_at: new Date().toISOString(),
  };
  for (const key of [
    "name",
    "title",
    "subtitle",
    "desktop_image_url",
    "mobile_image_url",
    "image_alt",
    "search_placeholder",
    "search_scope",
    "enabled",
    "status",
    "start_at",
    "end_at",
  ]) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await admin
    .from("brand_heroes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("brand_versions").insert({
    resource_type: "brand_heroes",
    resource_id: id,
    before_data: old,
    after_data: data,
    action: body.status === "published" ? "publish" : "update",
    created_by: auth!.profile.id,
  });

  await logAudit(auth!.profile.id, "update", "brand_heroes", id, old, data, request as never);

  try {
    revalidateTag("brand-system");
    if (data?.hero_key) revalidateTag(`brand-hero:${data.hero_key}`);
    revalidatePath("/");
  } catch {
    // ignore in non-next contexts
  }

  return NextResponse.json({ hero: data });
}
