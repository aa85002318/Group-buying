import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { mockProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types/database";
import {
  isSellableShopProduct,
  normalizeShopProductRow,
  sortProductsByShopHomeCategories,
} from "@/lib/shop/home-product-rails";

const SELECT =
  "id, name, slug, price, sale_price, website_price, original_price, msrp, image_url, stock, status, is_active, is_hot, is_new, is_popular, popular_sort_order, hot_sort_order, new_sort_order, package_spec, unit, specifications, publish_website, product_scope, allow_oversell, inventory_mode, category_id, created_at, brands:brand_id(name)";

function newScore(p: Product): number {
  // Prefer is_new, then lower new_sort_order, then newer created_at
  const isNewBoost = p.is_new ? 1_000_000 : 0;
  const sort = 10_000 - Number(p.new_sort_order ?? 100);
  const created = p.created_at ? new Date(String(p.created_at)).getTime() / 1e10 : 0;
  return isNewBoost + sort + created;
}

/**
 * GET /api/shop/new-products
 * Auto: products in shop-home categories, ordered by category then newness.
 */
export async function GET(request: Request) {
  const limit = Math.min(
    10,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 10) || 10)
  );

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      products: mockProducts
        .filter((p) => p.is_new !== false)
        .filter(isSellableShopProduct)
        .slice(0, limit),
      source: "fallback",
    });
  }

  try {
    const supabase = await createClient();

    const { data: cats } = await supabase
      .from("product_categories")
      .select("id, shop_home_sort_order")
      .eq("show_on_shop_home", true)
      .eq("is_active", true)
      .order("shop_home_sort_order", { ascending: true });

    const categories = (cats ?? []).map((c) => ({
      id: String(c.id),
      shop_home_sort_order: Number(c.shop_home_sort_order ?? 100),
    }));
    const catIds = categories.map((c) => c.id);

    // Prefer flagged new in home categories
    let query = supabase
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .eq("publish_website", true)
      .limit(Math.max(limit * 8, 40));

    if (catIds.length === 1) {
      query = query.eq("category_id", catIds[0]);
    } else if (catIds.length > 1) {
      query = query.in("category_id", catIds);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let products = sortProductsByShopHomeCategories(
      ((data ?? []) as Record<string, unknown>[])
        .map(normalizeShopProductRow)
        .filter(isSellableShopProduct)
        .filter((p) => p.is_new === true),
      categories,
      newScore
    ).slice(0, limit);

    if (!products.length) {
      products = sortProductsByShopHomeCategories(
        ((data ?? []) as Record<string, unknown>[])
          .map(normalizeShopProductRow)
          .filter(isSellableShopProduct),
        categories,
        (p) => (p.created_at ? new Date(String(p.created_at)).getTime() : 0)
      ).slice(0, limit);
    }

    return NextResponse.json({
      products,
      source: "category_auto",
      categories: categories.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗" },
      { status: 500 }
    );
  }
}
