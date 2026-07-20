import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getMockProductById,
  mockOrderItems,
  mockOrders,
  mockProducts,
  mockVideos,
} from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

function last7DaysLabels() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const product = getMockProductById(id) ?? mockProducts[0];
    if (!product) return NextResponse.json({ error: "找不到商品" }, { status: 404 });

    const items = mockOrderItems.filter((item) => item.product_id === id || item.product_id === product.id);
    const relatedOrders = mockOrders.filter((order) => items.some((item) => item.order_id === order.id));
    const soldQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = items.reduce((sum, item) => sum + item.subtotal, 0);
    const averagePrice = soldQuantity > 0 ? revenue / soldQuantity : 0;
    const grossProfit = items.reduce(
      (sum, item) => sum + (item.unit_price - Number(product.cost_price ?? product.price * 0.65)) * item.quantity,
      0
    );
    const refundedCount = relatedOrders.filter((order) => order.status === "refunded").length;
    const conversionRate = (product as { view_count?: number }).view_count
      ? (soldQuantity / ((product as { view_count?: number }).view_count ?? 1)) * 100
      : 4.2;
    const cartAddRate = (product as { cart_add_count?: number }).cart_add_count && (product as { view_count?: number }).view_count
      ? (((product as { cart_add_count?: number }).cart_add_count ?? 0) / ((product as { view_count?: number }).view_count ?? 1)) * 100
      : 9.8;

    const trend = last7DaysLabels().map((date, index) => ({
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      value: items.filter((_, itemIndex) => itemIndex % 7 === index % 7).reduce((sum, item) => sum + item.subtotal, 0),
    }));

    return NextResponse.json({
      product,
      summary: {
        soldQuantity,
        revenue,
        averagePrice,
        grossProfit,
        returnRate: relatedOrders.length ? (refundedCount / relatedOrders.length) * 100 : 0,
        favoriteCount: (product as { favorite_count?: number }).favorite_count ?? 18,
        viewCount: (product as { view_count?: number }).view_count ?? 420,
        cartAddRate,
        conversionRate,
      },
      trend,
      sources: {
        videos: mockVideos.filter((video) => video.product_id === product.id).length,
        activeOrders: relatedOrders.filter((order) => ["payment_confirmed", "preparing", "ready_for_pickup", "completed"].includes(order.status)).length,
      },
    });
  }

  const admin = createAdminClient();
  const { data: product, error: productError } = await admin.from("products").select("*").eq("id", id).single();
  if (productError || !product) return NextResponse.json({ error: "找不到商品" }, { status: 404 });

  const [itemsRes, analyticsRes, videoRes] = await Promise.all([
    admin
      .from("order_items")
      .select("quantity, subtotal, unit_price, order_id, orders(status, created_at)")
      .eq("product_id", id),
    admin.from("product_analytics").select("date, revenue, sold_quantity").eq("product_id", id).order("date", { ascending: true }).limit(30),
    admin.from("videos").select("id", { count: "exact", head: true }).eq("product_id", id),
  ]);

  const items = itemsRes.data ?? [];
  const soldQuantity = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const revenue = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const averagePrice = soldQuantity > 0 ? revenue / soldQuantity : 0;
  const grossProfit = items.reduce(
    (sum, item) => sum + (Number(item.unit_price) - Number(product.cost_price ?? 0)) * Number(item.quantity),
    0
  );
  const totalOrders = new Set(items.map((item) => item.order_id)).size;
  const refundedOrders = items.filter((item) => (item.orders as { status?: string } | null)?.status === "refunded").length;
  const viewCount = Number((product as { view_count?: number }).view_count ?? 0);
  const favoriteCount = Number((product as { favorite_count?: number }).favorite_count ?? 0);
  const cartAddCount = Number((product as { cart_add_count?: number }).cart_add_count ?? 0);

  const trend = (analyticsRes.data ?? []).map((row) => ({
    label: new Date(row.date).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" }),
    value: Number(row.revenue ?? 0),
  }));

  return NextResponse.json({
    product,
    summary: {
      soldQuantity,
      revenue,
      averagePrice,
      grossProfit,
      returnRate: totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0,
      favoriteCount,
      viewCount,
      cartAddRate: viewCount > 0 ? (cartAddCount / viewCount) * 100 : 0,
      conversionRate: viewCount > 0 ? (soldQuantity / viewCount) * 100 : 0,
    },
    trend: trend.length > 0 ? trend : last7DaysLabels().map((date) => ({ label: `${date.getMonth() + 1}/${date.getDate()}`, value: 0 })),
    sources: {
      videos: videoRes.count ?? 0,
      activeOrders: items.filter((item) => ["payment_confirmed", "preparing", "ready_for_pickup", "completed"].includes((item.orders as { status?: string } | null)?.status ?? "")).length,
    },
  });
}
