import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { FavoriteTargetType } from "@/lib/types/database";

const VALID_TYPES: FavoriteTargetType[] = ["product", "recipe", "video"];

function parseType(raw: unknown): FavoriteTargetType | null {
  const v = String(raw ?? "").trim();
  return VALID_TYPES.includes(v as FavoriteTargetType) ? (v as FavoriteTargetType) : null;
}

export async function GET(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const typeParam = new URL(request.url).searchParams.get("type");
  const filterType = typeParam && typeParam !== "all" ? parseType(typeParam) : null;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ favorites: [], items: [], productIds: [], keys: [] });
  }

  const supabase = await createClient();
  const userId = auth!.profile.id;

  let query = supabase
    .from("favorites")
    .select("id, user_id, target_type, target_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filterType) query = query.eq("target_type", filterType);

  const { data, error: fetchError } = await query;

  if (fetchError) {
    // Fallback to legacy product_favorites until migration applied
    if (fetchError.code === "42P01") {
      const legacy = await supabase
        .from("product_favorites")
        .select("id, product_id, created_at, products(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      const favorites = (legacy.data ?? []).map((f) => ({
        id: f.id,
        user_id: userId,
        target_type: "product" as const,
        target_id: f.product_id,
        created_at: f.created_at,
        product: f.products,
      }));
      return NextResponse.json({
        favorites,
        items: favorites,
        productIds: favorites.map((f) => f.target_id),
        keys: favorites.map((f) => `product:${f.target_id}`),
      });
    }
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
  }

  const rows = data ?? [];
  const productIds = rows.filter((r) => r.target_type === "product").map((r) => r.target_id);
  const recipeIds = rows.filter((r) => r.target_type === "recipe").map((r) => r.target_id);
  const videoIds = rows.filter((r) => r.target_type === "video").map((r) => r.target_id);

  const [productsRes, recipesRes, videosRes] = await Promise.all([
    productIds.length
      ? supabase.from("products").select("*").in("id", productIds)
      : Promise.resolve({ data: [] as unknown[] }),
    recipeIds.length
      ? supabase.from("recipes").select("id, title, slug, cover_image, status, difficulty, summary").in("id", recipeIds)
      : Promise.resolve({ data: [] as unknown[] }),
    videoIds.length
      ? supabase.from("videos").select("id, title, slug, thumbnail_url, status, is_active, summary").in("id", videoIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const productsById = new Map(
    ((productsRes.data ?? []) as Array<{ id: string }>).map((p) => [p.id, p])
  );
  const recipesById = new Map(
    ((recipesRes.data ?? []) as Array<{ id: string }>).map((r) => [r.id, r])
  );
  const videosById = new Map(
    ((videosRes.data ?? []) as Array<{ id: string }>).map((v) => [v.id, v])
  );

  const items = rows.map((r) => ({
    ...r,
    product: r.target_type === "product" ? productsById.get(r.target_id) ?? null : null,
    recipe: r.target_type === "recipe" ? recipesById.get(r.target_id) ?? null : null,
    video: r.target_type === "video" ? videosById.get(r.target_id) ?? null : null,
  }));

  return NextResponse.json({
    favorites: items,
    items,
    productIds: rows.filter((r) => r.target_type === "product").map((r) => r.target_id),
    keys: rows.map((r) => `${r.target_type}:${r.target_id}`),
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const targetType =
    parseType(body.target_type) ??
    (body.product_id ? ("product" as const) : null);
  const targetId = String(body.target_id ?? body.product_id ?? "").trim();

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "缺少收藏類型或 ID" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, target_type: targetType, target_id: targetId });
  }

  const supabase = await createClient();
  const userId = auth!.profile.id;

  const { error: insertError } = await supabase.from("favorites").insert({
    user_id: userId,
    target_type: targetType,
    target_id: targetId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, target_type: targetType, target_id: targetId });
    }
    if (insertError.code === "42P01" && targetType === "product") {
      const legacy = await supabase.from("product_favorites").insert({
        user_id: userId,
        product_id: targetId,
      });
      if (legacy.error && legacy.error.code !== "23505") {
        return NextResponse.json({ error: "收藏失敗" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, target_type: targetType, target_id: targetId });
    }
    return NextResponse.json({ error: "收藏失敗" }, { status: 500 });
  }

  // Keep legacy product_favorites in sync when present
  if (targetType === "product") {
    await supabase.from("product_favorites").upsert(
      { user_id: userId, product_id: targetId },
      { onConflict: "user_id,product_id", ignoreDuplicates: true }
    );
  }

  return NextResponse.json({ ok: true, target_type: targetType, target_id: targetId });
}
