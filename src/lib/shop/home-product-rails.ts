/** Shared shop-home product rails: order by shop main category, then score. */

import type { Product } from "@/lib/types/database";

export type ShopHomeCategoryRef = {
  id: string;
  shop_home_sort_order: number;
};

export function engagementScore(p: Product): number {
  return (
    Number(p.cart_add_count ?? 0) * 3 +
    Number(p.view_count ?? 0) +
    Number(p.favorite_count ?? 0) * 2
  );
}

export function isSellableShopProduct(p: Product): boolean {
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

export function normalizeShopProductRow(row: Record<string, unknown>): Product {
  const brandsRaw = row.brands;
  const brands = Array.isArray(brandsRaw)
    ? (brandsRaw[0] as Product["brands"])
    : (brandsRaw as Product["brands"]);
  return { ...(row as unknown as Product), brands };
}

/** Manual NEW flag, auto-cleared after new_until. */
export function isShopNewActive(p: Pick<Product, "is_new" | "new_until">, now = Date.now()) {
  if (!p.is_new) return false;
  if (!p.new_until) return true;
  const t = new Date(String(p.new_until)).getTime();
  if (Number.isNaN(t)) return true;
  return t >= now;
}

/**
 * Sort products by category shop_home_sort_order, then by scoreFn desc.
 * Products without a matching home category go last.
 */
export function sortProductsByShopHomeCategories(
  products: Product[],
  categories: ShopHomeCategoryRef[],
  scoreFn: (p: Product) => number
): Product[] {
  const catOrder = new Map(
    categories.map((c) => [c.id, Number(c.shop_home_sort_order ?? 9999)])
  );

  return [...products].sort((a, b) => {
    const aOrd = a.category_id ? (catOrder.get(a.category_id) ?? 99999) : 99999;
    const bOrd = b.category_id ? (catOrder.get(b.category_id) ?? 99999) : 99999;
    if (aOrd !== bOrd) return aOrd - bOrd;
    return scoreFn(b) - scoreFn(a);
  });
}
