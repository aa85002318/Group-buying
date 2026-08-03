import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .slice(0, 64);
}

/** GET /api/admin/shop/recipe-categories */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipe_categories")
    .select("*")
    .order("inspiration_sort_order", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

/** POST /api/admin/shop/recipe-categories */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "名稱必填" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ category: { id: `mock-${Date.now()}`, name } }, { status: 201 });
  }

  const admin = createAdminClient();
  const payload = {
    name,
    slug: String(body.slug ?? "").trim() || slugify(name) || `cat-${Date.now()}`,
    image_url: String(body.image_url ?? "").trim() || null,
    sort_order: Number(body.sort_order ?? 100) || 100,
    inspiration_sort_order: Number(body.inspiration_sort_order ?? 100) || 100,
    show_on_inspiration_wall: body.show_on_inspiration_wall !== false,
    is_active: body.is_active !== false,
  };

  const { data, error } = await admin
    .from("recipe_categories")
    .insert(payload)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "create",
    "recipe_category",
    data.id,
    null,
    data,
    request as never
  );
  return NextResponse.json({ category: data }, { status: 201 });
}
