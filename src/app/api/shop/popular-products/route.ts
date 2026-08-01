import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { mockProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types/database";

const SELECT =
  "id, name, slug, price, sale_price, website_price, original_price, msrp, image_url, stock, status, is_active, is_hot, is_new, is_popular, popular_sort_order, package_spec, unit, specifications, publish_website, product_scope, view_count, cart_add_count, favorite_count, allow_oversell, inventory_mode, brands:brand_id(name)";

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

function rankAuto(a: Product, b: Product) {
  const score = (p: Product) =>
    Number(p.cart_add_count ?? 0) * 3 +
    Number(p.view_count ?? 0) +
    Number(p.favorite_count ?? 0) * 2;
  return score(b) - score(a);
}

function normalizeProduct(row: Record<string, unknown>): Product {
  const brandsRaw = row.brands;
  const brands = Array.isArray(brandsRaw)
    ? (brandsRaw[0] as Product["brands"])
    : (brandsRaw as Product["brands"]);
  return { ...(row as unknown as Product), brands };
}

/**
 * GET /api/shop/popular-products
 * Manual is_popular first, then auto-fill by engagement metrics.
 */
export async function GET(request: Request) {
  const limit = Math.min(
    24,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 10) || 10)
  );

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      products: mockProducts.filter(isSellable).slice(0, limit),
      source: "fallback",
    });
  }

  try {
    const supabase = await createClient();

    const { data: manualRows, error: manualError } = await supabase
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .eq("publish_website", true)
      .eq("is_popular", true)
      .order("popular_sort_order", { ascending: true })
      .limit(limit);

    if (manualError) {
      return NextResponse.json({ error: manualError.message }, { status: 500 });
    }

    const manual = ((manualRows ?? []) as Record<string, unknown>[])
      .map(normalizeProduct)
      .filter(isSellable);
    const remaining = limit - manual.length;

    if (remaining <= 0) {
      return NextResponse.json({ products: manual.slice(0, limit), source: "manual" });
    }

    const excludeIds = manual.map((p) => p.id);
    let autoQuery = supabase
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .eq("publish_website", true)
      .order("cart_add_count", { ascending: false })
      .order("view_count", { ascending: false })
      .limit(Math.max(remaining * 3, remaining));

    if (excludeIds.length === 1) {
      autoQuery = autoQuery.neq("id", excludeIds[0]);
    } else if (excludeIds.length > 1) {
      autoQuery = autoQuery.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: autoRows } = await autoQuery;
    const auto = ((autoRows ?? []) as Record<string, unknown>[])
      .map(normalizeProduct)
      .filter(isSellable)
      .sort(rankAuto)
      .slice(0, remaining);

    return NextResponse.json({
      products: [...manual, ...auto].slice(0, limit),
      source: manual.length ? "mixed" : "auto",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗" },
      { status: 500 }
    );
  }
}
