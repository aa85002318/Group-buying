import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { isMemberEligibleForCampaign } from "@/lib/gifts/eligibility";
import { loadStoreNameMap, listMemberClaims, listPublishedCampaigns } from "@/lib/gifts/service";
import { serializeCampaignPublic } from "@/lib/gifts/serialize";
import { resolveMemberGiftStatus } from "@/lib/gifts/status";
import type { GiftCampaign, MemberGiftClaim } from "@/lib/gifts/types";
import { GIFT_UI_STATUS_LABEL } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

const MOCK_CAMPAIGN: GiftCampaign = {
  id: "mock-monthly-1",
  campaign_type: "monthly_member_gift",
  campaign_month: "2026-08",
  name: "2026 年 8 月會員禮",
  gift_name: "CHIMEIDIY 限定烘焙材料包",
  gift_image_url: null,
  description: "每月精選會員專屬好禮，數量有限，換完為止",
  terms: "一般會員即可兌換，每位限領 1 份。",
  notes: "請至指定門市出示兌換碼。",
  tag_label: "本月會員禮",
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
  total_quantity: 100,
  reserved_quantity: 12,
  redeemed_quantity: 60,
  per_member_limit: 1,
  per_order_quantity: 1,
  is_stackable: false,
  stack_limit: null,
  inventory_reservation_mode: "reserve_on_claim",
  applicable_purchase_store_ids: [],
  applicable_redemption_store_ids: ["mock-store"],
  require_same_store_redeem: false,
  display_start_at: null,
  claim_start_at: new Date(Date.now() - 86400000).toISOString(),
  claim_end_at: new Date(Date.now() + 20 * 86400000).toISOString(),
  redeem_start_at: new Date(Date.now() - 86400000).toISOString(),
  redeem_end_at: new Date(Date.now() + 25 * 86400000).toISOString(),
  show_remaining_quantity: true,
  low_stock_threshold: 10,
  status: "published",
};

export async function GET(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? undefined;

  if (!isSupabaseConfigured()) {
    const eligible = true;
    const status = resolveMemberGiftStatus({
      campaign: MOCK_CAMPAIGN,
      claim: null,
      eligible,
    });
    return NextResponse.json({
      campaigns: [
        {
          ...serializeCampaignPublic(MOCK_CAMPAIGN, {
            "mock-store": "棋美點心屋大安門市",
          }),
          member_status: status,
          member_status_label: GIFT_UI_STATUS_LABEL[status],
          claim: null,
        },
      ],
      claims: [],
      usable_claim_count: 0,
    });
  }

  try {
    const [campaigns, claims] = await Promise.all([
      listPublishedCampaigns(type),
      listMemberClaims(auth!.profile.id),
    ]);

    const storeIds = campaigns.flatMap((c) => c.applicable_redemption_store_ids ?? []);
    const storeNames = await loadStoreNameMap(storeIds);
    const claimsByCampaign = new Map<string, MemberGiftClaim>();
    for (const claim of claims) {
      if (!claimsByCampaign.has(claim.campaign_id)) {
        claimsByCampaign.set(claim.campaign_id, claim);
      }
    }

    const profile = {
      id: auth!.profile.id,
      created_at: (auth!.profile as { created_at?: string }).created_at ?? null,
      birthday: (auth!.profile as { birthday?: string }).birthday ?? null,
      member_level: (auth!.profile as { member_level?: string }).member_level ?? null,
    };

    const rows = campaigns.map((campaign) => {
      const claim = claimsByCampaign.get(campaign.id) ?? null;
      const eligible = isMemberEligibleForCampaign(campaign, profile);
      const member_status = resolveMemberGiftStatus({ campaign, claim, eligible });
      return {
        ...serializeCampaignPublic(campaign, storeNames),
        member_status,
        member_status_label: GIFT_UI_STATUS_LABEL[member_status],
        claim: claim
          ? {
              id: claim.id,
              status: claim.status,
              quantity: claim.quantity,
              expires_at: claim.expires_at,
              redeemed_at: claim.redeemed_at,
              redemption_number: claim.redemption_number,
              redeemed_store_name_snapshot: claim.redeemed_store_name_snapshot,
            }
          : null,
      };
    });

    const usable_claim_count = claims.filter((c) => c.status === "available").length;

    return NextResponse.json({
      campaigns: rows,
      claims,
      usable_claim_count,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗" },
      { status: 500 }
    );
  }
}
