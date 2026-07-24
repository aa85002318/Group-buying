import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts, mockStore, mockVideos, mockLivestreams, mockCategories } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfYesterday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function aggregateOrders(
  admin: ReturnType<typeof createAdminClient>,
  from: string,
  to?: string
) {
  let query = admin
    .from("orders")
    .select("total_amount, status, created_at, channel, group_buy_event_id")
    .gte("created_at", from);

  if (to) query = query.lt("created_at", to);

  const { data } = await query;
  const orders = data ?? [];
  const paid = orders.filter((o) =>
    ["payment_confirmed", "preparing", "ready_for_pickup", "completed"].includes(o.status)
  );
  const isGroupBuy = (o: { channel?: string | null; group_buy_event_id?: string | null }) =>
    o.channel === "group_buy" || Boolean(o.group_buy_event_id);

  return {
    orderCount: orders.length,
    revenue: paid.reduce((s, o) => s + Number(o.total_amount), 0),
    avgOrderValue: paid.length ? paid.reduce((s, o) => s + Number(o.total_amount), 0) / paid.length : 0,
    returns: orders.filter((o) => o.status === "refunded").length,
    mallOrders: orders.filter((o) => !isGroupBuy(o)).length,
    groupBuyOrders: orders.filter((o) => isGroupBuy(o)).length,
  };
}

export async function GET() {
  const { error } = await requireStaffOrAdmin();
  if (error) return error;

  const today = startOfToday();
  const yesterday = startOfYesterday();
  const yesterdayEnd = endOfYesterday();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  if (!isSupabaseConfigured()) {
    const orders = mockStore.orders;
    const todayOrders = orders.filter((o) => o.created_at >= today);
    const revenueTrend = Array.from({ length: 7 }, (_, i) => {
      const day = daysAgo(6 - i);
      const next = daysAgo(5 - i);
      const dayOrders = orders.filter((o) => o.created_at >= day && o.created_at < next);
      return {
        label: new Date(day).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" }),
        value: dayOrders.reduce((s, o) => s + o.total_amount, 0),
      };
    });

    return NextResponse.json({
      stats: {
        todayOrders: todayOrders.length,
        todaySales: todayOrders.reduce((s, o) => s + o.total_amount, 0),
        todayGrossProfit: todayOrders.reduce((s, o) => s + o.total_amount * 0.3, 0),
        todayAvgOrder: todayOrders.length
          ? todayOrders.reduce((s, o) => s + o.total_amount, 0) / todayOrders.length
          : 0,
        todayReturns: 0,
        todayMallOrders: todayOrders.filter((o) => !o.group_buy_event_id).length,
        todayGroupBuyOrders: todayOrders.filter((o) => Boolean(o.group_buy_event_id)).length,
        yesterdaySales: 0,
        weekSales: orders.filter((o) => o.created_at >= weekStart).reduce((s, o) => s + o.total_amount, 0),
        monthSales: orders.filter((o) => o.created_at >= monthStart).reduce((s, o) => s + o.total_amount, 0),
        pendingPayment: orders.filter((o) => o.status === "awaiting_payment").length,
        paymentPendingConfirm: orders.filter((o) => o.status === "payment_reported").length,
        readyPickup: orders.filter((o) => o.status === "ready_for_pickup").length,
        newMembers: 1,
        lowStockProducts: mockProducts.filter((p) => p.stock <= 5).length,
        closingSoonProducts: mockProducts.filter((p) => p.is_group_buy).slice(0, 5),
        publishedRecipes: 2,
        publishedVideos: mockVideos.length,
        publishedNews: 1,
        scheduledNotifications: 0,
        activeBenefits: 1,
        expiring7: 0,
        openDisposals: 0,
        openIssues: 0,
        pendingRecipeQuestions: 0,
        pendingSubmissions: 0,
        activeGroupBuys: 1,
        upcomingCourses: 1,
      },
      charts: {
        revenueTrend,
        topProducts: mockProducts.slice(0, 5).map((p, i) => ({
          label: p.name,
          value: (5 - i) * 12,
        })),
        topCategories: mockCategories.slice(0, 5).map((c, i) => ({
          label: c.name,
          value: (5 - i) * 8,
        })),
        genderRatio: [
          { label: "女", value: 62, color: "#FF4F7B" },
          { label: "男", value: 28, color: "#1E3A8A" },
          { label: "未知", value: 10, color: "#94A3B8" },
        ],
        cityHotspots: [
          { label: "台北", value: 35 },
          { label: "台中", value: 22 },
          { label: "高雄", value: 18 },
          { label: "桃園", value: 15 },
        ],
      },
      livestreamViews: mockLivestreams.reduce((s, l) => s + ((l as { view_count?: number }).view_count ?? 0), 0),
      videoViews: mockVideos.reduce((s, v) => s + v.view_count, 0),
    });
  }

  const admin = createAdminClient();

  const [
    todayAgg,
    yesterdayAgg,
    weekAgg,
    monthAgg,
    pendingPaymentRes,
    paymentReportedRes,
    readyPickupRes,
    newMembersRes,
    lowStockRes,
    closingSoonRes,
    trendRes,
    topProductsRes,
    categoryRes,
    genderRes,
    cityRes,
    videoViewsRes,
    livestreamViewsRes,
    publishedRecipesRes,
    publishedVideosRes,
    publishedNewsRes,
    scheduledNotificationsRes,
    activeBenefitsRes,
    expiring7Res,
    openDisposalsRes,
    openIssuesRes,
    pendingQuestionsRes,
    pendingSubmissionsRes,
    activeGroupBuysRes,
    upcomingCoursesRes,
  ] = await Promise.all([
    aggregateOrders(admin, today),
    aggregateOrders(admin, yesterday, yesterdayEnd),
    aggregateOrders(admin, weekStart),
    aggregateOrders(admin, monthStart),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "awaiting_payment"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "payment_reported"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "ready_for_pickup"),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today),
    admin.from("products").select("id", { count: "exact", head: true }).lte("stock", 5),
    admin.from("products").select("id, name, group_buy_end_at").eq("is_closing_soon", true).limit(5),
    admin.from("orders").select("total_amount, created_at").gte("created_at", daysAgo(6)),
    admin.from("order_items").select("product_id, quantity, products(name)").limit(200),
    admin.from("products").select("category_id, product_categories(name)").limit(200),
    admin.from("customer_statistics").select("gender"),
    admin.from("customer_statistics").select("city"),
    admin.from("videos").select("view_count"),
    admin.from("livestreams").select("view_count"),
    admin.from("recipes").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("videos").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("news_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin
      .from("notification_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),
    admin.from("member_benefits").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin
      .from("store_batches")
      .select("id", { count: "exact", head: true })
      .gte("expiry_date", today.slice(0, 10))
      .lte(
        "expiry_date",
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return d.toISOString().slice(0, 10);
        })()
      )
      .eq("status", "active"),
    admin
      .from("store_disposals")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "approved"]),
    admin
      .from("store_anomalies")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "processing"]),
    admin
      .from("recipe_discussions")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "pending", "unanswered"]),
    admin
      .from("recipe_submissions")
      .select("id", { count: "exact", head: true })
      .in("moderation_status", ["pending", "review"]),
    admin
      .from("group_buy_events")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "open", "ongoing"]),
    admin
      .from("baking_courses")
      .select("id", { count: "exact", head: true })
      .gte("start_at", today)
      .eq("is_active", true),
  ]);

  const trendMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
    trendMap.set(key, 0);
  }
  for (const order of trendRes.data ?? []) {
    const key = new Date(order.created_at).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + Number(order.total_amount));
    }
  }

  const productSales = new Map<string, { label: string; value: number }>();
  for (const item of topProductsRes.data ?? []) {
    const name = (item.products as { name?: string } | null)?.name ?? "未知商品";
    const current = productSales.get(item.product_id) ?? { label: name, value: 0 };
    current.value += item.quantity;
    productSales.set(item.product_id, current);
  }

  const categorySales = new Map<string, { label: string; value: number }>();
  for (const product of categoryRes.data ?? []) {
    const name = (product.product_categories as { name?: string } | null)?.name ?? "未分類";
    const current = categorySales.get(name) ?? { label: name, value: 0 };
    current.value += 1;
    categorySales.set(name, current);
  }

  const genderCounts = { female: 0, male: 0, unknown: 0 };
  for (const row of genderRes.data ?? []) {
    if (row.gender === "female") genderCounts.female++;
    else if (row.gender === "male") genderCounts.male++;
    else genderCounts.unknown++;
  }

  const cityCounts = new Map<string, number>();
  for (const row of cityRes.data ?? []) {
    if (!row.city) continue;
    cityCounts.set(row.city, (cityCounts.get(row.city) ?? 0) + 1);
  }

  return NextResponse.json({
    stats: {
      todayOrders: todayAgg.orderCount,
      todaySales: todayAgg.revenue,
      todayGrossProfit: todayAgg.revenue * 0.3,
      todayAvgOrder: todayAgg.avgOrderValue,
      todayReturns: todayAgg.returns,
      todayMallOrders: todayAgg.mallOrders,
      todayGroupBuyOrders: todayAgg.groupBuyOrders,
      yesterdaySales: yesterdayAgg.revenue,
      weekSales: weekAgg.revenue,
      monthSales: monthAgg.revenue,
      pendingPayment: pendingPaymentRes.count ?? 0,
      paymentPendingConfirm: paymentReportedRes.count ?? 0,
      readyPickup: readyPickupRes.count ?? 0,
      newMembers: newMembersRes.count ?? 0,
      lowStockProducts: lowStockRes.count ?? 0,
      closingSoonProducts: closingSoonRes.data ?? [],
      publishedRecipes: publishedRecipesRes.count ?? 0,
      publishedVideos: publishedVideosRes.count ?? 0,
      publishedNews: publishedNewsRes.count ?? 0,
      scheduledNotifications: scheduledNotificationsRes.count ?? 0,
      activeBenefits: activeBenefitsRes.count ?? 0,
      expiring7: expiring7Res.count ?? 0,
      openDisposals: openDisposalsRes.count ?? 0,
      openIssues: openIssuesRes.count ?? 0,
      pendingRecipeQuestions: pendingQuestionsRes.count ?? 0,
      pendingSubmissions: pendingSubmissionsRes.count ?? 0,
      activeGroupBuys: activeGroupBuysRes.count ?? 0,
      upcomingCourses: upcomingCoursesRes.count ?? 0,
    },
    charts: {
      revenueTrend: Array.from(trendMap.entries()).map(([label, value]) => ({ label, value })),
      topProducts: Array.from(productSales.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      topCategories: Array.from(categorySales.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      genderRatio: [
        { label: "女", value: genderCounts.female, color: "#FF4F7B" },
        { label: "男", value: genderCounts.male, color: "#1E3A8A" },
        { label: "未知", value: genderCounts.unknown, color: "#94A3B8" },
      ],
      cityHotspots: Array.from(cityCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    },
    videoViews: (videoViewsRes.data ?? []).reduce((s, v) => s + Number(v.view_count ?? 0), 0),
    livestreamViews: (livestreamViewsRes.data ?? []).reduce((s, l) => s + Number(l.view_count ?? 0), 0),
  });
}
