import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

function periodStart(period: string) {
  const d = new Date();
  if (period === "week") {
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
  } else if (period === "month") {
    d.setDate(1);
  }
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "today";
  const from = periodStart(period);

  if (!isSupabaseConfigured()) {
    const orders = mockStore.orders.filter((o) => o.created_at >= from);
    const revenue = orders.reduce((s, o) => s + o.total_amount, 0);
    return NextResponse.json({
      summary: {
        revenue,
        grossProfit: revenue * 0.3,
        orderCount: orders.length,
        avgOrderValue: orders.length ? revenue / orders.length : 0,
        itemsSold: orders.length * 2,
        returns: 0,
      },
      trend: [{ label: "今日", value: revenue }],
      topProducts: [{ label: "示範商品", value: 12 }],
    });
  }

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("total_amount, status, created_at")
    .gte("created_at", from);

  const paid = (orders ?? []).filter((o) =>
    ["payment_confirmed", "preparing", "ready_for_pickup", "completed"].includes(o.status)
  );
  const revenue = paid.reduce((s, o) => s + Number(o.total_amount), 0);

  const { data: items } = await admin
    .from("order_items")
    .select("quantity, products(name), created_at")
    .gte("created_at", from);

  const productMap = new Map<string, { label: string; value: number }>();
  for (const item of items ?? []) {
    const name = (item.products as { name?: string } | null)?.name ?? "未知";
    const current = productMap.get(name) ?? { label: name, value: 0 };
    current.value += item.quantity;
    productMap.set(name, current);
  }

  const trendMap = new Map<string, number>();
  for (const order of paid) {
    const key = new Date(order.created_at).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
    trendMap.set(key, (trendMap.get(key) ?? 0) + Number(order.total_amount));
  }

  return NextResponse.json({
    summary: {
      revenue,
      grossProfit: revenue * 0.3,
      orderCount: paid.length,
      avgOrderValue: paid.length ? revenue / paid.length : 0,
      itemsSold: (items ?? []).reduce((s, i) => s + i.quantity, 0),
      returns: (orders ?? []).filter((o) => o.status === "refunded").length,
    },
    trend: Array.from(trendMap.entries()).map(([label, value]) => ({ label, value })),
    topProducts: Array.from(productMap.values()).sort((a, b) => b.value - a.value).slice(0, 5),
  });
}
