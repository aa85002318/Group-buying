import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import { isMemberEligibleForCampaign } from "@/lib/gifts/eligibility";
import { generateRedemptionCode } from "@/lib/gifts/qr-token";
import type { GiftCampaign, MemberGiftClaim } from "@/lib/gifts/types";

export async function loadStoreNameMap(ids: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return {};
  const admin = createAdminClient();
  const { data } = await admin.from("stores").select("id, name").in("id", unique);
  const map: Record<string, string> = {};
  for (const s of data ?? []) map[s.id] = s.name;
  return map;
}

export async function listPublishedCampaigns(type?: string): Promise<GiftCampaign[]> {
  const admin = createAdminClient();
  let q = admin
    .from("gift_campaigns")
    .select("*")
    .in("status", ["published", "ended"])
    .order("claim_start_at", { ascending: false });
  if (type) q = q.eq("campaign_type", type);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as GiftCampaign[];
}

export async function listMemberClaims(memberId: string): Promise<MemberGiftClaim[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("member_gift_claims")
    .select("*, gift_campaigns(*)")
    .eq("member_id", memberId)
    .order("claimed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberGiftClaim[];
}

export async function claimMonthlyGift(opts: {
  campaignId: string;
  memberId: string;
  profile: { id: string; created_at?: string | null; birthday?: string | null; member_level?: string | null };
}): Promise<{ claim: MemberGiftClaim } | { error: string; code: string }> {
  const admin = createAdminClient();
  const { data: campaign, error: cErr } = await admin
    .from("gift_campaigns")
    .select("*")
    .eq("id", opts.campaignId)
    .maybeSingle();
  if (cErr) return { error: cErr.message, code: "db_error" };
  if (!campaign) return { error: "找不到活動", code: "not_found" };
  const c = campaign as GiftCampaign;

  if (c.campaign_type !== "monthly_member_gift") {
    return { error: "此活動不可自行領取", code: "wrong_type" };
  }
  if (c.status !== "published") {
    return { error: "活動未開放", code: "disabled" };
  }
  if (!isMemberEligibleForCampaign(c, opts.profile)) {
    return { error: "不符合兌換資格", code: "ineligible" };
  }

  const now = new Date();
  if (c.claim_start_at && now < new Date(c.claim_start_at)) {
    return { error: "領取尚未開始", code: "not_started" };
  }
  if (c.claim_end_at && now > new Date(c.claim_end_at)) {
    return { error: "領取已結束", code: "expired" };
  }
  if (availableQuantity(c) <= 0) {
    return { error: "本月會員禮已兌換完畢", code: "exhausted" };
  }

  const { count } = await admin
    .from("member_gift_claims")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", c.id)
    .eq("member_id", opts.memberId)
    .neq("status", "cancelled");

  if ((count ?? 0) >= c.per_member_limit) {
    return { error: "已達個人領取上限", code: "limit_reached" };
  }

  const issue_sequence = (count ?? 0) + 1;
  const redemption_code = generateRedemptionCode();
  const expires_at = c.redeem_end_at;

  // Reserve inventory first (atomic-ish check)
  if (c.inventory_reservation_mode === "reserve_on_claim") {
    const { data: reservedRows, error: rErr } = await admin
      .from("gift_campaigns")
      .update({
        reserved_quantity: c.reserved_quantity + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", c.id)
      .eq("reserved_quantity", c.reserved_quantity)
      .eq("redeemed_quantity", c.redeemed_quantity)
      .select("id");
    if (rErr) return { error: rErr.message, code: "db_error" };
    if (!reservedRows?.length) {
      return { error: "庫存不足或活動忙碌，請稍後再試", code: "exhausted" };
    }
  }

  const { data: claim, error: iErr } = await admin
    .from("member_gift_claims")
    .insert({
      campaign_id: c.id,
      member_id: opts.memberId,
      quantity: 1,
      issue_sequence,
      redemption_code,
      status: "available",
      expires_at,
    })
    .select("*, gift_campaigns(*)")
    .single();

  if (iErr) {
    // release reservation on unique/conflict
    if (c.inventory_reservation_mode === "reserve_on_claim") {
      await admin
        .from("gift_campaigns")
        .update({
          reserved_quantity: Math.max(0, c.reserved_quantity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", c.id);
    }
    if (iErr.code === "23505") {
      return { error: "您已領取此活動", code: "already_claimed" };
    }
    return { error: iErr.message, code: "db_error" };
  }

  await admin.from("gift_redemption_logs").insert({
    claim_id: claim.id,
    campaign_id: c.id,
    member_id: opts.memberId,
    action: "claim",
    result: "success",
  });

  return { claim: claim as MemberGiftClaim };
}
