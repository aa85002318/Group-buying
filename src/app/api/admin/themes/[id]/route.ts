import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.slug === "string") updates.slug = body.slug.trim();
  if (body.cover_image_url !== undefined) {
    updates.cover_image_url = typeof body.cover_image_url === "string" ? body.cover_image_url.trim() || null : null;
  }
  if (body.mobile_cover_image_url !== undefined) {
    updates.mobile_cover_image_url =
      typeof body.mobile_cover_image_url === "string" ? body.mobile_cover_image_url.trim() || null : null;
  }
  if (body.description !== undefined) {
    updates.description = typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if (body.theme_color !== undefined) {
    updates.theme_color = typeof body.theme_color === "string" ? body.theme_color.trim() || null : null;
  }
  if (body.starts_at !== undefined) updates.starts_at = body.starts_at || null;
  if (body.ends_at !== undefined) updates.ends_at = body.ends_at || null;
  if (body.status !== undefined) updates.status = body.status;
  if (body.featured_on_home !== undefined) updates.featured_on_home = Boolean(body.featured_on_home);
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 0;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ theme: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("seasonal_themes").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("seasonal_themes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_seasonal_theme", "seasonal_themes", id, old, data);
  return NextResponse.json({ theme: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("seasonal_themes").delete().eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_seasonal_theme", "seasonal_themes", id, null, null);
  return NextResponse.json({ ok: true });
}
