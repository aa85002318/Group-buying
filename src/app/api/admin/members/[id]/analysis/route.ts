import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockAdminProfile, mockOrders, mockOrderItems, mockProfile } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

function calcAgeGroup(birthday: string | null) {
  if (!birthday) return "未知";
  const age = Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const profile = id === mockAdminProfile.id ? mockAdminProfile : mockProfile;
    const orders = mockOrders.filter((order) => order.user_id === profile.id);
    const orderIds = new Set(orders.map((order) => order.id));
    const items = mockOrderItems.filter((item) => orderIds.has(item.order_id));
    const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    const topProductMap = new Map();
    for (const item of items) {
      const current = topProductMap.get(item.product_id) ?? { label: item.product_name, value: 0 };
      current.value += item.quantity;
      topProductMap.set(item.product_id, current);
    }

    return NextResponse.json({
      profile,
      summary: {
        gender: "未知",
        ageGroup: calcAgeGroup(profile.birthday),
        city: "台北市",
        district: "信義區",
        memberLevel: "一般會員",
        totalSpent,
        purchaseCount: orders.length,
        avgOrderValue,
        pendingOrders: orders.filter((order) => ["awaiting_payment", "payment_reported"].includes(order.status)).length,
      },
      topProducts: Array.from(topProductMap.values()).sort((a, b) => b.value - a.value).slice(0, 5),
      orderTrend: orders.map((order, index) => ({ label: `訂單 ${index + 1}`, value: order.total_amount })),
      orderStatuses: [
        { label: "待付款", value: orders.filter((o) => o.status === "awaiting_payment").length, color: "#FF4F7B" },
        { label: "待取貨", value: orders.filter((o) => o.status === "ready_for_pickup").length, color: "#1E3A8A" },
        { label: "已完成", value: orders.filter((o) => o.status === "completed").length, color: "#23B26D" },
      ],
    });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("profiles").select("*").eq("id", id).single();
  if (profileError || !profile) return NextResponse.json({ error: "找不到會員" }, { status: 404 });

  const { data: orders } = await admin.from("orders").select("id, total_amount, status, created_at").eq("user_id", id).order("created_at", { ascending: true });
  const { data: stats } = await admin.from("customer_statistics").select("*").eq("user_id", id).maybeSingle();

  const orderIds = (orders ?? []).map((order) => order.id);
  const { data: items } = orderIds.length
    ? await admin.from("order_items").select("product_id, product_name, quantity, subtotal").in("order_id", orderIds)
    : { data: [] };

  const totalSpent = (orders ?? []).reduce((sum, order) => sum + Number(order.total_amount), 0);
  const avgOrderValue = (orders ?? []).length > 0 ? totalSpent / (orders ?? []).length : 0;
  const topProductMap = new Map<string, { label: string; value: number }>();
  for (const item of items ?? []) {
    const current = topProductMap.get(item.product_id) ?? { label: item.product_name, value: 0 };
    current.value += Number(item.quantity);
    topProductMap.set(item.product_id, current);
  }

  return NextResponse.json({
    profile,
    summary: {
      gender: stats?.gender ?? "未知",
      ageGroup: stats?.age_group ?? calcAgeGroup(profile.birthday),
      city: stats?.city ?? "—",
      district: stats?.district ?? "—",
      memberLevel: stats?.member_level ?? "一般會員",
      totalSpent,
      purchaseCount: (orders ?? []).length,
      avgOrderValue,
      pendingOrders: (orders ?? []).filter((order) => ["awaiting_payment", "payment_reported"].includes(order.status)).length,
    },
    topProducts: Array.from(topProductMap.values()).sort((a, b) => b.value - a.value).slice(0, 5),
    orderTrend: (orders ?? []).map((order) => ({
      label: new Date(order.created_at).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" }),
      value: Number(order.total_amount),
    })),
    orderStatuses: [
      { label: "待付款", value: (orders ?? []).filter((o) => o.status === "awaiting_payment").length, color: "#FF4F7B" },
      { label: "待取貨", value: (orders ?? []).filter((o) => o.status === "ready_for_pickup").length, color: "#1E3A8A" },
      { label: "已完成", value: (orders ?? []).filter((o) => o.status === "completed").length, color: "#23B26D" },
    ],
  });
}
