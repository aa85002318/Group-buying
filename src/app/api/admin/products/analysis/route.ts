import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockOrderItems, mockProducts } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

type SortKey = "revenue" | "soldQuantity" | "conversionRate" | "viewCount" | "favoriteCount";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const sort = (searchParams.get("sort") as SortKey) || "revenue";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  if (!isSupabaseConfigured()) {
    const rankings = mockProducts.map((product) => {
      const items = mockOrderItems.filter((item) => item.product_id === product.id);
      const soldQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = items.reduce((sum, item) => sum + item.subtotal, 0);
      const viewCount = (product as { view_count?: number }).view_count ?? 420;
      const favoriteCount = (product as { favorite_count?: number }).favorite_count ?? 18;
      return {
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        price: product.price,
        soldQuantity,
        revenue,
        grossProfit: revenue * 0.35,
        viewCount,
        favoriteCount,
        conversionRate: viewCount > 0 ? (soldQuantity / viewCount) * 100 : 0,
        cartAddRate: 9.8,
      };
    });

    rankings.sort((a, b) => b[sort] - a[sort]);
    const totalRevenue = rankings.reduce((sum, r) => sum + r.revenue, 0);
    const totalSold = rankings.reduce((sum, r) => sum + r.soldQuantity, 0);

    return NextResponse.json({
      summary: { totalProducts: rankings.length, totalRevenue, totalSold },
      rankings: rankings.slice(0, limit),
    });
  }

  const admin = createAdminClient();
  const [productsRes, itemsRes] = await Promise.all([
    admin.from("products").select("id, name, image_url, price, cost_price, view_count, favorite_count, cart_add_count").eq("is_active", true),
    admin.from("order_items").select("product_id, quantity, subtotal, unit_price"),
  ]);

  const products = productsRes.data ?? [];
  const items = itemsRes.data ?? [];

  const itemMap = new Map<string, { soldQuantity: number; revenue: number; grossProfit: number }>();
  for (const item of items) {
    const current = itemMap.get(item.product_id) ?? { soldQuantity: 0, revenue: 0, grossProfit: 0 };
    current.soldQuantity += Number(item.quantity);
    current.revenue += Number(item.subtotal);
    current.grossProfit += (Number(item.unit_price) - 0) * Number(item.quantity);
    itemMap.set(item.product_id, current);
  }

  const productCostMap = new Map(products.map((p) => [p.id, Number(p.cost_price ?? 0)]));

  const rankings = products.map((product) => {
    const stats = itemMap.get(product.id) ?? { soldQuantity: 0, revenue: 0, grossProfit: 0 };
    const cost = productCostMap.get(product.id) ?? 0;
    const grossProfit = stats.soldQuantity > 0
      ? items
          .filter((i) => i.product_id === product.id)
          .reduce((sum, i) => sum + (Number(i.unit_price) - cost) * Number(i.quantity), 0)
      : 0;
    const viewCount = Number(product.view_count ?? 0);
    const favoriteCount = Number(product.favorite_count ?? 0);
    const cartAddCount = Number(product.cart_add_count ?? 0);

    return {
      id: product.id,
      name: product.name,
      image_url: product.image_url,
      price: Number(product.price),
      soldQuantity: stats.soldQuantity,
      revenue: stats.revenue,
      grossProfit,
      viewCount,
      favoriteCount,
      conversionRate: viewCount > 0 ? (stats.soldQuantity / viewCount) * 100 : 0,
      cartAddRate: viewCount > 0 ? (cartAddCount / viewCount) * 100 : 0,
    };
  });

  rankings.sort((a, b) => b[sort] - a[sort]);

  const totalRevenue = rankings.reduce((sum, r) => sum + r.revenue, 0);
  const totalSold = rankings.reduce((sum, r) => sum + r.soldQuantity, 0);

  return NextResponse.json({
    summary: { totalProducts: rankings.length, totalRevenue, totalSold },
    rankings: rankings.slice(0, limit),
  });
}
