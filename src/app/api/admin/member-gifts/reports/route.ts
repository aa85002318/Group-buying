import { NextResponse } from "next/server";
import { requireGiftAuditRead } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import type { GiftCampaign } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

function dayKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function GET(request: Request) {
  const { error } = await requireGiftAuditRead();
  if (error) return error;

  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaign_id");
  const storeId = url.searchParams.get("store_id");
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const format = url.searchParams.get("format");
  const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days") ?? 30)));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      reports: [],
      daily_trend: [],
      by_store: [],
      failure_reasons: [],
      duplicate_scans: 0,
      stores: [],
    });
  }

  const admin = createAdminClient();
  let cq = admin.from("gift_campaigns").select("*").order("updated_at", { ascending: false });
  if (campaignId) cq = cq.eq("id", campaignId);
  const { data: campaigns } = await cq;

  const { data: storeRows } = await admin
    .from("stores")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const reports = [];
  for (const raw of campaigns ?? []) {
    const c = raw as GiftCampaign;
    const [{ count: claimed }, { count: redeemed }, { count: expired }, { count: cancelled }] =
      await Promise.all([
        admin
          .from("member_gift_claims")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", c.id),
        admin
          .from("member_gift_claims")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", c.id)
          .eq("status", "redeemed"),
        admin
          .from("member_gift_claims")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", c.id)
          .eq("status", "expired"),
        admin
          .from("member_gift_claims")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", c.id)
          .eq("status", "cancelled"),
      ]);

    const { data: items } = await admin
      .from("gift_campaign_items")
      .select("cost_amount, redeemed_quantity")
      .eq("campaign_id", c.id);
    const gift_cost = (items ?? []).reduce(
      (sum, i) => sum + Number(i.cost_amount ?? 0) * Number(i.redeemed_quantity ?? 0),
      0
    );

    // Estimate cost from redeemed claims with item cost if item redeemed_quantity not maintained
    const { data: redeemedWithItem } = await admin
      .from("member_gift_claims")
      .select("quantity, gift_campaign_items(cost_amount)")
      .eq("campaign_id", c.id)
      .eq("status", "redeemed")
      .limit(5000);
    const claimCost = (redeemedWithItem ?? []).reduce((sum, row) => {
      const cost = Number(
        (row.gift_campaign_items as { cost_amount?: number } | null)?.cost_amount ?? 0
      );
      return sum + cost * Number(row.quantity ?? 1);
    }, 0);

    const claimedN = claimed ?? 0;
    const redeemedN = redeemed ?? 0;
    reports.push({
      campaign_id: c.id,
      name: c.name,
      campaign_type: c.campaign_type,
      status: c.status,
      total_quantity: c.total_quantity,
      reserved_quantity: c.reserved_quantity,
      redeemed_quantity: c.redeemed_quantity,
      available_quantity: availableQuantity(c),
      claimed_count: claimedN,
      redeemed_count: redeemedN,
      unused_count: Math.max(0, claimedN - redeemedN - (expired ?? 0) - (cancelled ?? 0)),
      expired_count: expired ?? 0,
      cancelled_count: cancelled ?? 0,
      gift_cost: Math.round((claimCost || gift_cost) * 100) / 100,
      redemption_rate:
        claimedN > 0 ? Math.round((redeemedN / claimedN) * 1000) / 10 : 0,
    });
  }

  if (format === "participants_csv" || format === "csv") {
    if (format === "participants_csv") {
      let pq = admin
        .from("member_gift_claims")
        .select(
          "id, status, quantity, claimed_at, redeemed_at, expires_at, redemption_number, redeemed_store_name_snapshot, redeemed_staff_code_snapshot, campaign_id, gift_campaigns(name), profiles:member_id(full_name, member_number, phone), gift_campaign_items(gift_name, cost_amount)"
        )
        .order("claimed_at", { ascending: false })
        .limit(5000);
      if (campaignId) pq = pq.eq("campaign_id", campaignId);
      if (storeId) pq = pq.eq("redeemed_store_id", storeId);
      if (status) pq = pq.eq("status", status);
      if (from) pq = pq.gte("claimed_at", from);
      if (to) pq = pq.lte("claimed_at", to);
      const { data: rows } = await pq;
      const header = [
        "claim_id",
        "campaign",
        "member_name",
        "member_number",
        "phone",
        "gift_name",
        "status",
        "quantity",
        "claimed_at",
        "redeemed_at",
        "store",
        "staff",
        "cost",
        "redemption_number",
      ];
      const lines = [header.join(",")];
      for (const r of rows ?? []) {
        const camp = r.gift_campaigns as { name?: string } | null;
        const profile = r.profiles as {
          full_name?: string;
          member_number?: string;
          phone?: string;
        } | null;
        const item = r.gift_campaign_items as {
          gift_name?: string;
          cost_amount?: number;
        } | null;
        lines.push(
          [
            r.id,
            `"${String(camp?.name ?? "").replace(/"/g, '""')}"`,
            `"${String(profile?.full_name ?? "").replace(/"/g, '""')}"`,
            profile?.member_number ?? "",
            profile?.phone ?? "",
            `"${String(item?.gift_name ?? "").replace(/"/g, '""')}"`,
            r.status,
            r.quantity,
            r.claimed_at ?? "",
            r.redeemed_at ?? "",
            `"${String(r.redeemed_store_name_snapshot ?? "").replace(/"/g, '""')}"`,
            r.redeemed_staff_code_snapshot ?? "",
            item?.cost_amount ?? "",
            r.redemption_number ?? "",
          ].join(",")
        );
      }
      return new NextResponse("\uFEFF" + lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="member-gifts-participants.csv"',
        },
      });
    }

    const header = [
      "campaign_id",
      "name",
      "type",
      "status",
      "total",
      "claimed",
      "redeemed",
      "unused",
      "expired",
      "cancelled",
      "available",
      "gift_cost",
      "redemption_rate",
    ];
    const lines = [header.join(",")];
    for (const r of reports) {
      lines.push(
        [
          r.campaign_id,
          `"${String(r.name).replace(/"/g, '""')}"`,
          r.campaign_type,
          r.status,
          r.total_quantity,
          r.claimed_count,
          r.redeemed_count,
          r.unused_count,
          r.expired_count,
          r.cancelled_count,
          r.available_quantity,
          r.gift_cost,
          r.redemption_rate,
        ].join(",")
      );
    }
    return new NextResponse("\uFEFF" + lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="member-gifts-report.csv"',
      },
    });
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const rangeStart = from ? new Date(from) : since;
  const rangeEnd = to ? new Date(to) : null;

  let redeemedQ = admin
    .from("member_gift_claims")
    .select("id, redeemed_at, redeemed_store_id, redeemed_store_name_snapshot, campaign_id")
    .eq("status", "redeemed")
    .gte("redeemed_at", rangeStart.toISOString())
    .order("redeemed_at", { ascending: true })
    .limit(5000);
  if (campaignId) redeemedQ = redeemedQ.eq("campaign_id", campaignId);
  if (storeId) redeemedQ = redeemedQ.eq("redeemed_store_id", storeId);
  if (rangeEnd) redeemedQ = redeemedQ.lte("redeemed_at", rangeEnd.toISOString());
  const { data: redeemedRows } = await redeemedQ;

  const trendMap = new Map<string, number>();
  const dayCount = Math.max(
    1,
    Math.ceil((Date.now() - rangeStart.getTime()) / 86400000) + 1
  );
  const trendDays = Math.min(90, dayCount);
  for (let i = 0; i < trendDays; i++) {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);
    if (rangeEnd && d > rangeEnd) break;
    const pad = (n: number) => String(n).padStart(2, "0");
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    trendMap.set(key, 0);
  }
  const storeMap = new Map<string, { label: string; value: number }>();

  for (const row of redeemedRows ?? []) {
    const key = dayKey(row.redeemed_at as string | null);
    if (key && trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    } else if (key) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
    const sid = (row.redeemed_store_id as string | null) ?? "unknown";
    const label =
      (row.redeemed_store_name_snapshot as string | null)?.trim() ||
      (sid === "unknown" ? "未記錄門市" : sid.slice(0, 8));
    const prev = storeMap.get(sid);
    if (prev) prev.value += 1;
    else storeMap.set(sid, { label, value: 1 });
  }

  const daily_trend = Array.from(trendMap.entries()).map(([label, value]) => ({
    label: label.slice(5),
    value,
  }));
  const by_store = Array.from(storeMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
    .map((s) => ({ ...s, color: "#153E73" }));

  // Participants preview (latest 50)
  let pq = admin
    .from("member_gift_claims")
    .select(
      "id, status, claimed_at, redeemed_at, redemption_number, redeemed_store_name_snapshot, gift_campaigns(name), profiles:member_id(full_name, member_number), gift_campaign_items(gift_name, cost_amount)"
    )
    .order("claimed_at", { ascending: false })
    .limit(50);
  if (campaignId) pq = pq.eq("campaign_id", campaignId);
  if (storeId) pq = pq.eq("redeemed_store_id", storeId);
  if (status) pq = pq.eq("status", status);
  if (from) pq = pq.gte("claimed_at", from);
  if (to) pq = pq.lte("claimed_at", to);
  const { data: participants } = await pq;

  let failQ = admin
    .from("gift_redemption_logs")
    .select("id, action, result, failure_reason, created_at, campaign_id")
    .in("result", ["failure", "error", "anomaly"])
    .gte("created_at", rangeStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);
  if (campaignId) failQ = failQ.eq("campaign_id", campaignId);
  if (rangeEnd) failQ = failQ.lte("created_at", rangeEnd.toISOString());
  const { data: failRows } = await failQ;

  const reasonMap = new Map<string, number>();
  let duplicate_scans = 0;
  for (const row of failRows ?? []) {
    const reason =
      String(row.failure_reason ?? "").trim() ||
      `${row.action ?? "unknown"}/${row.result ?? "failure"}`;
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
    if (
      /already_redeemed|已兌換|已使用|duplicate/i.test(reason) ||
      String(row.action) === "redeem_duplicate"
    ) {
      duplicate_scans += 1;
    }
  }
  const failure_reasons = Array.from(reasonMap.entries())
    .map(([label, value]) => ({ label, value, color: "#B42318" }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  let dupQ = admin
    .from("gift_redemption_logs")
    .select("id", { count: "exact", head: true })
    .eq("action", "redeem_duplicate")
    .gte("created_at", rangeStart.toISOString());
  if (campaignId) dupQ = dupQ.eq("campaign_id", campaignId);
  if (rangeEnd) dupQ = dupQ.lte("created_at", rangeEnd.toISOString());
  const { count: dupCount } = await dupQ;
  if ((dupCount ?? 0) > duplicate_scans) duplicate_scans = dupCount ?? 0;

  return NextResponse.json({
    reports,
    daily_trend,
    by_store,
    failure_reasons,
    duplicate_scans,
    days: trendDays,
    stores: storeRows ?? [],
    participants: (participants ?? []).map((p) => ({
      id: p.id,
      status: p.status,
      claimed_at: p.claimed_at,
      redeemed_at: p.redeemed_at,
      redemption_number: p.redemption_number,
      store: p.redeemed_store_name_snapshot,
      campaign: (p.gift_campaigns as { name?: string } | null)?.name,
      member_name: (p.profiles as { full_name?: string } | null)?.full_name,
      member_number: (p.profiles as { member_number?: string } | null)?.member_number,
      gift_name: (p.gift_campaign_items as { gift_name?: string } | null)?.gift_name,
      cost: (p.gift_campaign_items as { cost_amount?: number } | null)?.cost_amount,
    })),
  });
}
