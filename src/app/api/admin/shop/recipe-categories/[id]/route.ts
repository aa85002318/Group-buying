import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/shop/recipe-categories/[id] */
export async function PATCH(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.slug !== undefined) updates.slug = String(body.slug).trim();
  if (body.image_url !== undefined) {
    updates.image_url = String(body.image_url).trim() || null;
  }
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 100;
  if (body.inspiration_sort_order !== undefined) {
    updates.inspiration_sort_order = Number(body.inspiration_sort_order) || 100;
  }
  if (body.show_on_inspiration_wall !== undefined) {
    updates.show_on_inspiration_wall = Boolean(body.show_on_inspiration_wall);
  }
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ category: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("recipe_categories").select("*").eq("id", id).single();
  const { data, error } = await admin
    .from("recipe_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "update",
    "recipe_category",
    id,
    old,
    data,
    request as never
  );
  return NextResponse.json({ category: data });
}

/** DELETE /api/admin/shop/recipe-categories/[id] */
export async function DELETE(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("recipe_categories").select("*").eq("id", id).single();
  const { error } = await admin.from("recipe_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "delete",
    "recipe_category",
    id,
    old,
    null,
    request as never
  );
  return NextResponse.json({ ok: true });
}
