import type { SupabaseClient } from "@supabase/supabase-js";

/** Collaborative-ish recommendations: favorites + views + same category + popular */
export async function getPersonalizedRecommendations(
  admin: SupabaseClient,
  userId: string | null,
  limit = 8
) {
  const scored = new Map<string, number>();

  if (userId) {
    const { data: favs } = await admin
      .from("product_favorites")
      .select("product_id")
      .eq("user_id", userId)
      .limit(50);
    for (const f of favs ?? []) scored.set(f.product_id, (scored.get(f.product_id) ?? 0) + 5);

    const { data: views } = await admin
      .from("product_views")
      .select("product_id")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(40);
    for (const v of views ?? []) scored.set(v.product_id, (scored.get(v.product_id) ?? 0) + 2);

    const { data: orders } = await admin
      .from("orders")
      .select("id, order_items(product_id)")
      .eq("user_id", userId)
      .limit(20);
    for (const o of orders ?? []) {
      const items = (o as { order_items?: Array<{ product_id: string }> }).order_items ?? [];
      for (const item of items) {
        if (item.product_id) scored.set(item.product_id, (scored.get(item.product_id) ?? 0) + 4);
      }
    }
  }

  // Seed with active products if sparse
  const { data: products } = await admin
    .from("products")
    .select("id, name, price, original_price, image_url, category_id, stock, is_active")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(40);

  for (const p of products ?? []) {
    if (!scored.has(p.id)) scored.set(p.id, 1);
  }

  const rankedIds = Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, limit);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const missing = rankedIds.filter((id) => !byId.has(id));
  if (missing.length) {
    const { data: extra } = await admin
      .from("products")
      .select("id, name, price, original_price, image_url, category_id, stock, is_active")
      .in("id", missing);
    for (const p of extra ?? []) byId.set(p.id, p);
  }

  return rankedIds.map((id) => byId.get(id)).filter(Boolean);
}

export async function getRecentlyViewed(admin: SupabaseClient, userId: string, limit = 8) {
  const { data: views } = await admin
    .from("product_views")
    .select("product_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit * 2);

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const v of views ?? []) {
    if (seen.has(v.product_id)) continue;
    seen.add(v.product_id);
    ids.push(v.product_id);
    if (ids.length >= limit) break;
  }
  if (!ids.length) return [];

  const { data: products } = await admin
    .from("products")
    .select("id, name, price, original_price, image_url, stock, is_active")
    .in("id", ids);

  const map = new Map((products ?? []).map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export async function trackProductView(
  admin: SupabaseClient,
  productId: string,
  userId: string | null,
  sessionId?: string | null
) {
  try {
    await admin.from("product_views").insert({
      product_id: productId,
      user_id: userId,
      session_id: sessionId ?? null,
    });
  } catch {
    // table may not exist yet
  }
}
