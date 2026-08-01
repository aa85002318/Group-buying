import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { mockProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types/database";

const SELECT =
  "id, name, slug, price, sale_price, website_price, original_price, msrp, image_url, stock, status, is_active, is_hot, is_new, is_popular, popular_sort_order, hot_sort_order, new_sort_order, package_spec, unit, specifications, publish_website, product_scope, allow_oversell, inventory_mode, brands:brand_id(name)";

function isSellable(p: Product): boolean {
  if (p.is_active === false) return false;
  if (p.status && ["archived", "draft", "inactive"].includes(String(p.status))) {
    return false;
  }
  const stock = Number(p.stock ?? 0);
  if (stock <= 0 && !p.allow_oversell && p.inventory_mode !== "preorder") {
    return false;
  }
  return true;
}

function normalizeProduct(row: Record<string, unknown>): Product {
  const brandsRaw = row.brands;
  const brands = Array.isArray(brandsRaw)
    ? (brandsRaw[0] as Product["brands"])
    : (brandsRaw as Product["brands"]);
  return { ...(row as unknown as Product), brands };
}

/**
 * GET /api/shop/new-products
 * is_new = true, ordered by new_sort_order ASC, max 10.
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
        .filter(isSellable)
        .slice(0, limit),
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
      .eq("is_new", true)
      .order("new_sort_order", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const products = ((data ?? []) as Record<string, unknown>[])
      .map(normalizeProduct)
      .filter(isSellable)
      .slice(0, limit);

    if (!products.length) {
      // Fallback: newest published website products
      const { data: recent } = await supabase
        .from("products")
        .select(SELECT)
        .eq("is_active", true)
        .eq("publish_website", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      return NextResponse.json({
        products: ((recent ?? []) as Record<string, unknown>[])
          .map(normalizeProduct)
          .filter(isSellable)
          .slice(0, limit),
        source: "recent",
      });
    }

    return NextResponse.json({ products, source: "manual" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗" },
      { status: 500 }
    );
  }
}
