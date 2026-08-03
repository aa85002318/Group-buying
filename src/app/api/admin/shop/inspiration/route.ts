import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

const SELECT =
  "id, title, slug, cover_image, status, show_in_inspiration_wall, is_featured_inspiration, inspiration_sort_order, inspiration_category, inspiration_banner_url, inspiration_use_ip_image, published_at, updated_at";

/** GET /api/admin/shop/inspiration — recipes for inspiration wall CMS */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ recipes: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipes")
    .select(SELECT)
    .order("inspiration_sort_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipes: data ?? [] });
}

/** PATCH /api/admin/shop/inspiration — update wall fields on a recipe */
export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少食譜 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ recipe: { id, ...body } });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.show_in_inspiration_wall !== undefined) {
    updates.show_in_inspiration_wall = Boolean(body.show_in_inspiration_wall);
  }
  if (body.is_featured_inspiration !== undefined) {
    updates.is_featured_inspiration = Boolean(body.is_featured_inspiration);
  }
  if (body.inspiration_sort_order !== undefined) {
    updates.inspiration_sort_order = Number(body.inspiration_sort_order) || 0;
  }
  if (body.inspiration_category !== undefined) {
    updates.inspiration_category = String(body.inspiration_category ?? "").trim() || null;
  }
  if (body.inspiration_banner_url !== undefined) {
    updates.inspiration_banner_url =
      String(body.inspiration_banner_url ?? "").trim() || null;
  }
  if (body.inspiration_use_ip_image !== undefined) {
    updates.inspiration_use_ip_image = Boolean(body.inspiration_use_ip_image);
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("recipes").select("*").eq("id", id).single();
  const { data, error } = await admin
    .from("recipes")
    .update(updates)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "update",
    "recipe_inspiration",
    id,
    old,
    data,
    request as never
  );
  return NextResponse.json({ recipe: data });
}
