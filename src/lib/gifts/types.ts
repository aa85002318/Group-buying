export type GiftCampaignType = "monthly_member_gift" | "store_spend_gift";

export type GiftCampaignStatus = "draft" | "published" | "paused" | "ended";

export type GiftClaimStatus = "available" | "redeemed" | "expired" | "cancelled";

export type GiftEligibilityType =
  | "all_members"
  | "member_levels"
  | "member_list"
  | "birthday_month"
  | "new_members"
  | "spend_threshold"
  | "points_threshold";

export type GiftInventoryMode = "reserve_on_claim" | "deduct_on_redeem";

export type GiftMemberUiStatus =
  | "not_started"
  | "claimable"
  | "claimed"
  | "redeemable"
  | "redeemed"
  | "sold_out"
  | "exhausted"
  | "expired"
  | "disabled"
  | "ineligible"
  | "store_mismatch";

export type GiftCampaign = {
  id: string;
  campaign_type: GiftCampaignType;
  campaign_month: string | null;
  name: string;
  gift_name: string;
  gift_image_url: string | null;
  description: string | null;
  terms: string | null;
  notes: string | null;
  tag_label: string | null;
  eligibility_type: GiftEligibilityType;
  eligible_member_levels: string[] | null;
  eligible_member_ids: string[] | null;
  eligibility_min_spend: number | null;
  eligibility_min_points: number | null;
  minimum_spend: number | null;
  spend_calculation_type: string;
  exclude_shipping: boolean;
  exclude_coupons: boolean;
  exclude_cancelled: boolean;
  exclude_refunded: boolean;
  required_order_statuses: string[] | null;
  total_quantity: number;
  reserved_quantity: number;
  redeemed_quantity: number;
  per_member_limit: number;
  per_order_quantity: number;
  is_stackable: boolean;
  stack_limit: number | null;
  inventory_reservation_mode: GiftInventoryMode;
  applicable_purchase_store_ids: string[] | null;
  applicable_redemption_store_ids: string[] | null;
  require_same_store_redeem: boolean;
  display_start_at: string | null;
  claim_start_at: string | null;
  claim_end_at: string | null;
  redeem_start_at: string | null;
  redeem_end_at: string | null;
  show_remaining_quantity: boolean;
  low_stock_threshold: number | null;
  status: GiftCampaignStatus;
  created_at?: string;
  updated_at?: string;
};

export type MemberGiftClaim = {
  id: string;
  campaign_id: string;
  member_id: string;
  source_order_id: string | null;
  qualification_amount: number | null;
  quantity: number;
  issue_sequence: number;
  redemption_code: string;
  qr_nonce: string | null;
  status: GiftClaimStatus;
  claimed_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  redeemed_store_id: string | null;
  redeemed_store_name_snapshot: string | null;
  redeemed_by: string | null;
  redeemed_staff_code_snapshot: string | null;
  redemption_number: string | null;
  purchase_store_id: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  gift_campaigns?: GiftCampaign | null;
};

export const GIFT_UI_STATUS_LABEL: Record<GiftMemberUiStatus, string> = {
  not_started: "尚未開始",
  claimable: "可領取",
  claimed: "已領取",
  redeemable: "可兌換",
  redeemed: "已兌換",
  sold_out: "已額滿",
  exhausted: "兌換完畢",
  expired: "已過期",
  disabled: "已停用",
  ineligible: "不符合資格",
  store_mismatch: "不適用此門市",
};

export const GIFT_CAMPAIGN_TYPE_LABEL: Record<GiftCampaignType, string> = {
  monthly_member_gift: "本月會員禮",
  store_spend_gift: "門市滿額贈",
};
