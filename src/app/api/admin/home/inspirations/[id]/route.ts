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
  if (body.subtitle !== undefined) {
    updates.subtitle = typeof body.subtitle === "string" ? body.subtitle.trim() || null : null;
  }
  if (body.image_url !== undefined) {
    updates.image_url = typeof body.image_url === "string" ? body.image_url.trim() || null : null;
  }
  if (body.link_type !== undefined) {
    updates.link_type = typeof body.link_type === "string" ? body.link_type.trim() || null : null;
  }
  if (body.target_url !== undefined) {
    updates.target_url = typeof body.target_url === "string" ? body.target_url.trim() || null : null;
  }
  if (body.button_label !== undefined) {
    updates.button_label = typeof body.button_label === "string" ? body.button_label.trim() || "去看看" : "去看看";
  }
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 0;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.start_at !== undefined) updates.start_at = body.start_at || null;
  if (body.end_at !== undefined) updates.end_at = body.end_at || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ inspiration: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("home_inspirations").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("home_inspirations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_home_inspiration", "home_inspirations", id, old, data);
  return NextResponse.json({ inspiration: data });
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
  const { error: deleteError } = await admin.from("home_inspirations").delete().eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_home_inspiration", "home_inspirations", id, null, null);
  return NextResponse.json({ ok: true });
}
