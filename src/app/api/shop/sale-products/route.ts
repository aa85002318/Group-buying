import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { mockProducts } from "@/lib/mock-data";
import {
  isSellableShopProduct,
  isShopOnSale,
  normalizeShopProductRow,
  saleScore,
} from "@/lib/shop/home-product-rails";

const SELECT =
  "id, name, slug, price, sale_price, website_price, original_price, msrp, image_url, stock, status, is_active, is_hot, is_new, is_weekly_pick, is_popular, popular_sort_order, hot_sort_order, new_sort_order, package_spec, unit, specifications, publish_website, product_scope, allow_oversell, inventory_mode, category_id, brands:brand_id(name)";

/**
 * GET /api/shop/sale-products
 * Discounted / weekly-pick products. Hidden on storefront when empty.
 */
export async function GET(request: Request) {
  const limit = Math.min(
    12,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 10) || 10)
  );

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      products: mockProducts.filter(isShopOnSale).filter(isSellableShopProduct).slice(0, limit),
      source: "fallback",
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .eq("publish_website", true)
      .limit(Math.max(limit * 12, 60));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const products = ((data ?? []) as Record<string, unknown>[])
      .map(normalizeShopProductRow)
      .filter(isSellableShopProduct)
      .filter(isShopOnSale)
      .sort((a, b) => saleScore(b) - saleScore(a))
      .slice(0, limit);

    return NextResponse.json({ products, source: "sale" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗" },
      { status: 500 }
    );
  }
}
