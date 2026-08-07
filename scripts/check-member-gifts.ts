/**
 * 門市會員禮 — 本機／staging smoke 檢查
 * 用法：npm run check:member-gifts
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env";
import { isMemberEligibleForCampaign } from "../src/lib/gifts/eligibility";
import { createGiftQrToken, verifyGiftQrToken } from "../src/lib/gifts/qr-token";
import type { GiftCampaign } from "../src/lib/gifts/types";

loadEnvLocal();

type Result = { name: string; ok: boolean; detail?: string };

function assert(name: string, ok: boolean, detail?: string): Result {
  return { name, ok, detail };
}

function baseCampaign(partial: Partial<GiftCampaign> = {}): GiftCampaign {
  return {
    id: "c1",
    campaign_type: "monthly_member_gift",
    campaign_month: "2026-08",
    name: "t",
    gift_name: "g",
    gift_image_url: null,
    description: null,
    terms: null,
    notes: null,
    tag_label: null,
    eligibility_type: "all_members",
    eligible_member_levels: [],
    eligible_member_ids: [],
    eligibility_min_spend: null,
    eligibility_min_points: null,
    minimum_spend: null,
    spend_calculation_type: "paid_ex_shipping",
    exclude_shipping: true,
    exclude_coupons: false,
    exclude_cancelled: true,
    exclude_refunded: true,
    required_order_statuses: ["completed"],
    total_quantity: 10,
    reserved_quantity: 0,
    redeemed_quantity: 0,
    per_member_limit: 1,
    per_order_quantity: 1,
    is_stackable: false,
    stack_limit: null,
    inventory_reservation_mode: "reserve_on_claim",
    applicable_purchase_store_ids: [],
    applicable_redemption_store_ids: [],
    require_same_store_redeem: false,
    display_start_at: null,
    claim_start_at: null,
    claim_end_at: null,
    redeem_start_at: null,
    redeem_end_at: null,
    show_remaining_quantity: true,
    low_stock_threshold: 10,
    status: "published",
    ...partial,
  };
}

async function main() {
  const results: Result[] = [];

  // --- Pure logic ---
  const eligibleAll = isMemberEligibleForCampaign(baseCampaign(), { id: "m1" });
  results.push(assert("eligibility:all_members", eligibleAll));

  const ptsOk = isMemberEligibleForCampaign(
    baseCampaign({ eligibility_type: "points_threshold", eligibility_min_points: 100 }),
    { id: "m1", member_points: 120 }
  );
  const ptsNg = isMemberEligibleForCampaign(
    baseCampaign({ eligibility_type: "points_threshold", eligibility_min_points: 100 }),
    { id: "m1", member_points: 20 }
  );
  results.push(assert("eligibility:points_threshold pass", ptsOk));
  results.push(assert("eligibility:points_threshold fail", !ptsNg));

  const birthday = new Date();
  const bdayIso = `2000-${String(birthday.getMonth() + 1).padStart(2, "0")}-15`;
  const bdayOk = isMemberEligibleForCampaign(
    baseCampaign({ eligibility_type: "birthday_month" }),
    { id: "m1", birthday: bdayIso }
  );
  results.push(assert("eligibility:birthday_month", bdayOk));

  const { token, payload } = createGiftQrToken({
    claimId: "00000000-0000-0000-0000-000000000001",
    campaignId: "00000000-0000-0000-0000-000000000002",
    memberId: "00000000-0000-0000-0000-000000000003",
  });
  const verified = verifyGiftQrToken(token);
  results.push(
    assert(
      "qr:sign_and_verify",
      verified.ok === true && verified.payload?.claim_id === payload.claim_id,
      verified.error
    )
  );
  results.push(
    assert("qr:ttl_about_60s", Math.abs(payload.expires_at - Date.now() - 60_000) < 5_000)
  );

  // --- DB (optional) ---
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    results.push(assert("db:skipped", true, "SUPABASE env missing — logic checks only"));
  } else {
    const admin = createClient(url, key, { auth: { persistSession: false } });
    for (const table of [
      "gift_campaigns",
      "member_gift_claims",
      "gift_redemption_logs",
      "gift_campaign_items",
      "gift_campaign_store_inventory",
      "gift_reversal_requests",
    ]) {
      const { error } = await admin.from(table).select("id", { count: "exact", head: true });
      results.push(assert(`db:table:${table}`, !error, error?.message));
    }
    const { error: ptsErr } = await admin.from("profiles").select("member_points").limit(1);
    results.push(assert("db:column:member_points", !ptsErr, ptsErr?.message));

    const { count: published } = await admin
      .from("gift_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    results.push(
      assert("db:published_campaigns", true, `count=${published ?? 0}`)
    );
  }

  console.log("=== Member gifts smoke ===");
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? "OK " : "FAIL";
    console.log(`${mark}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
    if (!r.ok) failed += 1;
  }
  console.log(failed ? `\nFailed: ${failed}` : "\nAll checks passed.");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
