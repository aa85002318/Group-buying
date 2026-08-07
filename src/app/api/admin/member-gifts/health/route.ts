import { NextResponse } from "next/server";
import { requireGiftRead } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; detail?: string };

/** 會員禮模組健全檢查（表／欄位／RPC／環境） */
export async function GET() {
  const { error } = await requireGiftRead();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      checks: [],
    });
  }

  const admin = createAdminClient();
  const checks: Check[] = [];

  for (const table of [
    "gift_campaigns",
    "member_gift_claims",
    "gift_redemption_logs",
    "gift_campaign_items",
    "gift_campaign_store_inventory",
    "gift_reversal_requests",
  ]) {
    const { error: qErr } = await admin.from(table).select("id", { count: "exact", head: true });
    checks.push({ name: `table:${table}`, ok: !qErr, detail: qErr?.message });
  }

  for (const [name, query] of [
    ["column:profiles.member_points", () => admin.from("profiles").select("member_points").limit(1)],
    [
      "column:gift_campaigns.item_selection_mode",
      () => admin.from("gift_campaigns").select("item_selection_mode").limit(1),
    ],
    [
      "column:gift_campaigns.auto_hide_when_sold_out",
      () => admin.from("gift_campaigns").select("auto_hide_when_sold_out").limit(1),
    ],
  ] as const) {
    const { error: cErr } = await query();
    checks.push({ name, ok: !cErr, detail: cErr?.message });
  }

  const { count: published } = await admin
    .from("gift_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  checks.push({ name: "published_campaigns", ok: true, detail: String(published ?? 0) });

  const { count: available } = await admin
    .from("member_gift_claims")
    .select("id", { count: "exact", head: true })
    .eq("status", "available");
  checks.push({ name: "available_claims", ok: true, detail: String(available ?? 0) });

  const { count: pendingReversals } = await admin
    .from("gift_reversal_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  checks.push({ name: "pending_reversals", ok: true, detail: String(pendingReversals ?? 0) });

  const { error: rpcErr } = await admin.rpc("redeem_member_gift_claim", {
    p_claim_id: "00000000-0000-0000-0000-000000000000",
    p_store_id: "00000000-0000-0000-0000-000000000000",
    p_staff_id: "00000000-0000-0000-0000-000000000000",
    p_staff_code: "health",
    p_store_name: "health",
    p_idempotency_key: `health-${Date.now()}`,
  });
  const rpcMissing =
    !!rpcErr &&
    /function|does not exist|schema cache/i.test(rpcErr.message) &&
    !/not found|claim|stock|store/i.test(rpcErr.message);
  checks.push({
    name: "rpc:redeem_member_gift_claim",
    ok: !rpcMissing,
    detail: rpcErr?.message?.slice(0, 160),
  });

  checks.push({
    name: "env:CRON_SECRET",
    ok: Boolean(process.env.CRON_SECRET?.trim()) || process.env.NODE_ENV !== "production",
    detail: process.env.CRON_SECRET?.trim()
      ? "set"
      : process.env.NODE_ENV === "production"
        ? "missing in production"
        : "optional in non-production",
  });

  checks.push({
    name: "env:MEMBER_GIFT_QR_SECRET_or_fallback",
    ok: Boolean(
      process.env.MEMBER_GIFT_QR_SECRET?.trim() ||
        process.env.NEXTAUTH_SECRET?.trim() ||
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ),
    detail: process.env.MEMBER_GIFT_QR_SECRET?.trim()
      ? "MEMBER_GIFT_QR_SECRET"
      : "using fallback secret env",
  });

  const ok = checks.every((c) => c.ok);
  return NextResponse.json({
    ok,
    checks,
    qa_doc: "/docs/MEMBER-GIFTS-QA.md",
    checked_at: new Date().toISOString(),
  });
}
