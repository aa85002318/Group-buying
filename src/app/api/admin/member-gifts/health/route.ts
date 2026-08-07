import { NextResponse } from "next/server";
import { requireGiftRead } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** 會員禮模組健全檢查（表／RPC／活動數） */
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
  const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

  const tables = [
    "gift_campaigns",
    "member_gift_claims",
    "gift_redemption_logs",
    "gift_campaign_items",
    "gift_campaign_store_inventory",
    "gift_reversal_requests",
  ];

  for (const table of tables) {
    const { error: qErr } = await admin.from(table).select("id", { count: "exact", head: true });
    checks.push({
      name: `table:${table}`,
      ok: !qErr,
      detail: qErr?.message,
    });
  }

  const { count: published } = await admin
    .from("gift_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  checks.push({
    name: "published_campaigns",
    ok: true,
    detail: String(published ?? 0),
  });

  const { count: available } = await admin
    .from("member_gift_claims")
    .select("id", { count: "exact", head: true })
    .eq("status", "available");
  checks.push({
    name: "available_claims",
    ok: true,
    detail: String(available ?? 0),
  });

  // Probe redeem RPC exists (call with nil should fail gracefully, not missing-fn)
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

  const ok = checks.every((c) => c.ok);
  return NextResponse.json({
    ok,
    checks,
    checked_at: new Date().toISOString(),
  });
}
