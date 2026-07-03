import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore, mockProducts, mockVideos, mockLivestreams } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET() {
  const { error } = await requireStaffOrAdmin();
  if (error) return error;

  const today = startOfToday();
  const monthStart = startOfMonth();

  if (!isSupabaseConfigured()) {
    const orders = mockStore.orders;
    const todayOrders = orders.filter((o) => o.created_at >= today);
    const monthlyCommissions = mockStore.commissions.filter(
      (c) => c.created_at >= monthStart && ["approved", "issued"].includes(c.status)
    );

    return NextResponse.json({
      stats: {
        todayOrders: todayOrders.length,
        todaySales: todayOrders.reduce((s, o) => s + o.total_amount, 0),
        pendingPayment: orders.filter((o) => o.status === "awaiting_payment").length,
        paymentPendingConfirm: orders.filter((o) => o.status === "payment_reported").length,
        readyPickup: orders.filter((o) => o.status === "ready_for_pickup").length,
        newMembers: 1,
        shareOrders: orders.filter((o) => o.share_source_type).length,
        pendingRewards: mockStore.rewards.filter((r) => r.status === "pending").length,
        pendingCommissions: mockStore.commissions.filter((c) => c.status === "pending_review").length,
        monthlyCommissionTotal: monthlyCommissions.reduce((s, c) => s + c.commission_amount, 0),
        livestreamViews: mockLivestreams.reduce((s, l) => s + ((l as { view_count?: number }).view_count ?? 0), 0),
        videoViews: mockVideos.reduce((s, v) => s + v.view_count, 0),
        activeProducts: mockProducts.filter((p) => p.is_active).length,
        activeGroupBuys: 1,
      },
    });
  }

  const admin = createAdminClient();

  const [
    todayOrdersRes,
    pendingPaymentRes,
    paymentReportedRes,
    readyPickupRes,
    newMembersRes,
    shareOrdersRes,
    pendingRewardsRes,
    pendingCommissionsRes,
    monthlyCommissionRes,
    videoViewsRes,
    livestreamViewsRes,
  ] = await Promise.all([
    admin.from("orders").select("total_amount").gte("created_at", today),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "awaiting_payment"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "payment_reported"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "ready_for_pickup"),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today),
    admin.from("orders").select("id", { count: "exact", head: true }).not("share_source_type", "is", null),
    admin.from("reward_records").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("commission_records").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    admin
      .from("commission_records")
      .select("commission_amount")
      .gte("created_at", monthStart)
      .in("status", ["approved", "issued"]),
    admin.from("videos").select("view_count"),
    admin.from("livestreams").select("view_count"),
  ]);

  const todayOrders = todayOrdersRes.data ?? [];
  const monthlyCommissions = monthlyCommissionRes.data ?? [];

  return NextResponse.json({
    stats: {
      todayOrders: todayOrders.length,
      todaySales: todayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
      pendingPayment: pendingPaymentRes.count ?? 0,
      paymentPendingConfirm: paymentReportedRes.count ?? 0,
      readyPickup: readyPickupRes.count ?? 0,
      newMembers: newMembersRes.count ?? 0,
      shareOrders: shareOrdersRes.count ?? 0,
      pendingRewards: pendingRewardsRes.count ?? 0,
      pendingCommissions: pendingCommissionsRes.count ?? 0,
      monthlyCommissionTotal: monthlyCommissions.reduce((s, c) => s + Number(c.commission_amount), 0),
      livestreamViews: (livestreamViewsRes.data ?? []).reduce((s, l) => s + Number(l.view_count ?? 0), 0),
      videoViews: (videoViewsRes.data ?? []).reduce((s, v) => s + Number(v.view_count ?? 0), 0),
    },
  });
}
