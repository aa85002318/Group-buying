import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { mapInspirationRow } from "@/lib/shop/inspiration";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/shop/inspiration/[id] */
export async function PATCH(request: Request, ctx: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await ctx.params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ post: { id, ...body } });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    "category",
    "card_type",
    "title",
    "image_url",
    "aspect",
    "author_name",
    "author_avatar",
    "time_label",
    "likes",
    "comments",
    "materials",
    "rating",
    "difficulty",
    "cook_time",
    "tip_body",
    "product_name",
    "product_href",
    "href",
    "is_featured",
    "sort_order",
    "is_active",
  ] as const;

  for (const key of fields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (typeof body.materials === "string") {
    updates.materials = body.materials
      .split(/[,，]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_inspiration_posts").select("*").eq("id", id).single();
  const { data, error } = await admin
    .from("shop_inspiration_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "shop_inspiration_post", id, old, data, request as never);
  return NextResponse.json({ post: mapInspirationRow(data as Record<string, unknown>) });
}

/** DELETE /api/admin/shop/inspiration/[id] */
export async function DELETE(request: Request, ctx: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await ctx.params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_inspiration_posts").select("*").eq("id", id).single();
  const { error } = await admin.from("shop_inspiration_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "shop_inspiration_post", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
