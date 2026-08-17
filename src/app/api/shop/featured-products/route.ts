import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { mockProducts } from "@/lib/mock-data";
import {
  engagementScore,
  isSellableShopProduct,
  normalizeShopProductRow,
  sortProductsByShopHomeCategories,
} from "@/lib/shop/home-product-rails";

const SELECT =
  "id, name, slug, price, sale_price, website_price, original_price, msrp, image_url, stock, status, is_active, is_hot, is_new, is_featured, is_popular, popular_sort_order, hot_sort_order, new_sort_order, package_spec, unit, specifications, publish_website, product_scope, view_count, cart_add_count, favorite_count, allow_oversell, inventory_mode, category_id, brands:brand_id(name)";

/**
 * GET /api/shop/featured-products
 * Manual 精選 (is_featured). Hidden on storefront when empty.
 */
export async function GET(request: Request) {
  const limit = Math.min(
    12,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 8) || 8)
  );

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      products: mockProducts
        .filter((p) => p.is_featured)
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

    let query = supabase
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .eq("publish_website", true)
      .eq("is_featured", true)
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

    const products = sortProductsByShopHomeCategories(
      ((data ?? []) as Record<string, unknown>[])
        .map(normalizeShopProductRow)
        .filter(isSellableShopProduct),
      categories,
      engagementScore
    ).slice(0, limit);

    return NextResponse.json({
      products,
      source: "is_featured",
      categories: categories.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗" },
      { status: 500 }
    );
  }
}
