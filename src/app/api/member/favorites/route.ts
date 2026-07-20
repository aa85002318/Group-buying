import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ favorites: [], productIds: [] });
  }

  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("product_favorites")
    .select("id, product_id, created_at, products(*)")
    .eq("user_id", auth!.profile.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    if (fetchError.code === "42P01") return NextResponse.json({ favorites: [], productIds: [] });
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
  }

  const favorites = data ?? [];
  return NextResponse.json({
    favorites,
    productIds: favorites.map((f) => f.product_id),
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const productId = body.product_id?.trim();
  if (!productId) return NextResponse.json({ error: "缺少商品 ID" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, product_id: productId });
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("product_favorites").insert({
    user_id: auth!.profile.id,
    product_id: productId,
  });

  if (insertError) {
    if (insertError.code === "23505") return NextResponse.json({ ok: true, product_id: productId });
    return NextResponse.json({ error: "收藏失敗" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, product_id: productId });
}
