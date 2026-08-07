import { NextResponse } from "next/server";
import { requireGiftRead } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import type { GiftCampaign } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET() {
  const { error } = await requireGiftRead();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      kpi: {
        active_campaigns: 1,
        claimed_today: 3,
        redeemed_today: 1,
        pending_redeem: 12,
        remaining_stock: 88,
        low_stock_campaigns: 0,
        expiring_soon: 1,
        anomaly_logs: 0,
        pending_reversals: 0,
        auto_issued_today: 0,
      },
      active_campaigns: [],
      low_stock: [],
      expiring: [],
      anomalies: [],
    });
  }

  const admin = createAdminClient();
  const today = startOfTodayIso();
  const in7d = new Date(Date.now() + 7 * 86400000).toISOString();

  const [
    { data: campaigns },
    { count: claimedToday },
    { count: redeemedToday },
    { count: pendingRedeem },
    { data: anomalies },
    { count: pendingReversals },
    { count: autoIssuedToday },
  ] = await Promise.all([
    admin.from("gift_campaigns").select("*").order("sort_order", { ascending: true }),
    admin
      .from("member_gift_claims")
      .select("id", { count: "exact", head: true })
      .gte("claimed_at", today),
    admin
      .from("member_gift_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "redeemed")
      .gte("redeemed_at", today),
    admin
      .from("member_gift_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "available"),
    admin
      .from("gift_redemption_logs")
      .select("id, action, result, failure_reason, created_at, campaign_id")
      .in("result", ["anomaly", "failure", "error"])
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("gift_reversal_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("gift_redemption_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "auto_issue")
      .eq("result", "success")
      .gte("created_at", today),
  ]);

  const list = (campaigns ?? []) as GiftCampaign[];
  const active = list.filter((c) => c.status === "published");
  const remaining = active.reduce((sum, c) => sum + availableQuantity(c), 0);
  const lowStock = active.filter(
    (c) =>
      availableQuantity(c) > 0 &&
      availableQuantity(c) <= Number(c.low_stock_threshold ?? 10)
  );
  const expiring = active.filter(
    (c) => c.redeem_end_at && c.redeem_end_at <= in7d && c.redeem_end_at >= new Date().toISOString()
  );

  return NextResponse.json({
    kpi: {
      active_campaigns: active.length,
      claimed_today: claimedToday ?? 0,
      redeemed_today: redeemedToday ?? 0,
      pending_redeem: pendingRedeem ?? 0,
      remaining_stock: remaining,
      low_stock_campaigns: lowStock.length,
      expiring_soon: expiring.length,
      anomaly_logs: anomalies?.length ?? 0,
      pending_reversals: pendingReversals ?? 0,
      auto_issued_today: autoIssuedToday ?? 0,
    },
    active_campaigns: active.slice(0, 8).map((c) => ({
      id: c.id,
      name: c.name,
      gift_name: c.gift_name,
      available_quantity: availableQuantity(c),
      total_quantity: c.total_quantity,
      reserved_quantity: c.reserved_quantity,
      redeemed_quantity: c.redeemed_quantity,
      campaign_type: c.campaign_type,
      redeem_end_at: c.redeem_end_at,
    })),
    low_stock: lowStock.map((c) => ({
      id: c.id,
      name: c.name,
      available_quantity: availableQuantity(c),
      low_stock_threshold: c.low_stock_threshold,
    })),
    expiring: expiring.map((c) => ({
      id: c.id,
      name: c.name,
      redeem_end_at: c.redeem_end_at,
    })),
    anomalies: anomalies ?? [],
  });
}
