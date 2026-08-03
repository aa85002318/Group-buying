import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/shop/features/[id] */
export async function PATCH(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.icon !== undefined) updates.icon = String(body.icon).trim() || "truck";
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.subtitle !== undefined) updates.subtitle = String(body.subtitle).trim();
  if (body.image_url !== undefined) {
    updates.image_url = String(body.image_url).trim() || null;
  }
  if (body.link_type !== undefined) {
    updates.link_type = body.link_type === "external" ? "external" : "internal";
  }
  if (body.link_url !== undefined) {
    updates.link_url = String(body.link_url).trim() || "/";
  }
  if (body.background_color !== undefined) {
    updates.background_color = String(body.background_color).trim() || "#E8F3FF";
  }
  if (body.sort_order !== undefined) {
    updates.sort_order = Number(body.sort_order) || 1;
  }
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ feature: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_features").select("*").eq("id", id).single();
  const { data, error } = await admin
    .from("shop_features")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "shop_feature", id, old, data, request as never);
  return NextResponse.json({ feature: data });
}

/** DELETE /api/admin/shop/features/[id] — soft prefer deactivate; allow hard delete */
export async function DELETE(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_features").select("*").eq("id", id).single();
  const { error } = await admin.from("shop_features").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "shop_feature", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
