import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_INSPIRATION_POSTS,
  mapInspirationRow,
} from "@/lib/shop/inspiration";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/inspiration */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ posts: DEFAULT_INSPIRATION_POSTS });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_inspiration_posts")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    posts: data?.length
      ? data.map((row) => mapInspirationRow(row as Record<string, unknown>))
      : DEFAULT_INSPIRATION_POSTS,
  });
}

/** POST /api/admin/shop/inspiration */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "標題必填" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { post: { id: `mock-${Date.now()}`, title } },
      { status: 201 }
    );
  }

  const materials = Array.isArray(body.materials)
    ? body.materials.map(String)
    : String(body.materials ?? "")
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);

  const payload = {
    category: String(body.category ?? "community"),
    card_type: String(body.card_type ?? body.category ?? "community"),
    title,
    image_url: String(body.image_url ?? "").trim(),
    aspect: String(body.aspect ?? "4/5"),
    author_name: String(body.author_name ?? "CHIMEIDIY").trim() || "CHIMEIDIY",
    author_avatar: body.author_avatar ? String(body.author_avatar).trim() : null,
    time_label: body.time_label ? String(body.time_label).trim() : null,
    likes: Number(body.likes ?? 0) || 0,
    comments: Number(body.comments ?? 0) || 0,
    materials,
    rating: Number(body.rating ?? 5) || 5,
    difficulty: body.difficulty ? String(body.difficulty).trim() : null,
    cook_time: body.cook_time ? String(body.cook_time).trim() : null,
    tip_body: body.tip_body ? String(body.tip_body).trim() : null,
    product_name: body.product_name ? String(body.product_name).trim() : null,
    product_href: body.product_href ? String(body.product_href).trim() : null,
    href: String(body.href ?? "/recipes").trim() || "/recipes",
    is_featured: body.is_featured !== false,
    sort_order: Number(body.sort_order ?? 100) || 100,
    is_active: body.is_active !== false,
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_inspiration_posts")
    .insert(payload)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "create",
    "shop_inspiration_post",
    data.id,
    null,
    data,
    request as never
  );
  return NextResponse.json({ post: mapInspirationRow(data as Record<string, unknown>) }, { status: 201 });
}
