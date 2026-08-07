export type GiftCampaignType =
  | "monthly_member_gift"
  | "store_spend_gift"
  | "targeted_member_gift"
  | "birthday_gift"
  | "new_member_gift"
  | "event_limited_gift";

export type GiftCampaignStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "paused"
  | "ended";

export type GiftClaimStatus = "available" | "redeemed" | "expired" | "cancelled";

export type GiftEligibilityType =
  | "all_members"
  | "member_levels"
  | "member_list"
  | "birthday_month"
  | "new_members"
  | "spend_threshold"
  | "points_threshold"
  | "member_tags"
  | "registration_date"
  | "verified_contact";

export type GiftSpendMode = "single_order" | "period_accumulate";

export type GiftInventoryMode = "reserve_on_claim" | "deduct_on_redeem";

export type GiftInventoryScope = "shared" | "per_store";

export type GiftItemSelectionMode = "single" | "member_pick" | "random" | "staff_pick";

export const GIFT_ITEM_SELECTION_LABEL: Record<GiftItemSelectionMode, string> = {
  single: "單一品項（活動預設贈品）",
  member_pick: "會員任選一款",
  random: "系統隨機分配",
  staff_pick: "門市核銷時選擇",
};

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
  campaign_code?: string | null;
  name: string;
  gift_name: string;
  gift_image_url: string | null;
  list_image_url?: string | null;
  banner_image_url?: string | null;
  description: string | null;
  terms: string | null;
  notes: string | null;
  tag_label: string | null;
  eligibility_type: GiftEligibilityType;
  eligible_member_levels: string[] | null;
  eligible_member_ids: string[] | null;
  eligible_member_tags?: string[] | null;
  eligibility_min_spend: number | null;
  eligibility_min_points: number | null;
  eligibility_registered_from?: string | null;
  eligibility_registered_to?: string | null;
  require_phone_verified?: boolean;
  require_email_verified?: boolean;
  minimum_spend: number | null;
  spend_calculation_type: string;
  spend_mode?: GiftSpendMode;
  exclude_shipping: boolean;
  exclude_coupons: boolean;
  exclude_cancelled: boolean;
  exclude_refunded: boolean;
  required_order_statuses: string[] | null;
  applicable_product_ids?: string[] | null;
  applicable_category_ids?: string[] | null;
  excluded_product_ids?: string[] | null;
  total_quantity: number;
  reserved_quantity: number;
  redeemed_quantity: number;
  per_member_limit: number;
  per_order_quantity: number;
  is_stackable: boolean;
  stack_limit: number | null;
  inventory_reservation_mode: GiftInventoryMode;
  inventory_scope?: GiftInventoryScope;
  applicable_purchase_store_ids: string[] | null;
  applicable_redemption_store_ids: string[] | null;
  excluded_store_ids?: string[] | null;
  require_same_store_redeem: boolean;
  allow_cross_store_redeem?: boolean;
  require_store_selection?: boolean;
  item_selection_mode?: GiftItemSelectionMode;
  auto_hide_when_sold_out?: boolean;
  show_on_frontend?: boolean;
  sort_order?: number;
  redeem_within_days?: number | null;
  per_member_daily_limit?: number | null;
  allow_repeat_participation?: boolean;
  stackable_with_other_gifts?: boolean;
  require_self_redeem?: boolean;
  frontend_title?: string | null;
  frontend_subtitle?: string | null;
  claim_button_label?: string | null;
  sold_out_label?: string | null;
  activity_start_at?: string | null;
  activity_end_at?: string | null;
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

export type GiftCampaignItem = {
  id: string;
  campaign_id: string;
  gift_name: string;
  gift_image_url?: string | null;
  gift_code?: string | null;
  product_sku?: string | null;
  description?: string | null;
  quantity_per_redeem: number;
  cost_amount?: number | null;
  requires_store_prep?: boolean;
  requires_variant?: boolean;
  substitute_item_id?: string | null;
  allow_substitute_when_oos?: boolean;
  sort_order?: number;
  is_active?: boolean;
  total_quantity?: number | null;
  reserved_quantity?: number;
  redeemed_quantity?: number;
};

export type MemberGiftClaim = {
  id: string;
  campaign_id: string;
  member_id: string;
  gift_item_id?: string | null;
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
  designated_store_id?: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  reversed_at?: string | null;
  reverse_reason?: string | null;
  reversed_by?: string | null;
  gift_campaigns?: GiftCampaign | null;
};

export type GiftStoreInventory = {
  id?: string;
  campaign_id: string;
  store_id: string;
  allocated_quantity: number;
  reserved_quantity: number;
  redeemed_quantity: number;
  low_stock_threshold: number | null;
  store_name?: string;
};

export const GIFT_ELIGIBILITY_LABEL: Record<GiftEligibilityType, string> = {
  all_members: "全部會員",
  member_levels: "指定會員等級",
  member_list: "指定會員名單",
  birthday_month: "生日會員",
  new_members: "新註冊會員",
  spend_threshold: "消費門檻",
  points_threshold: "點數門檻",
  member_tags: "指定會員標籤",
  registration_date: "指定註冊日期",
  verified_contact: "已完成手機或 Email 驗證",
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
  monthly_member_gift: "每月會員禮",
  store_spend_gift: "門市滿額贈",
  targeted_member_gift: "指定會員贈禮",
  birthday_gift: "生日會員禮",
  new_member_gift: "新會員禮",
  event_limited_gift: "活動限定贈禮",
};

export const GIFT_CAMPAIGN_STATUS_LABEL: Record<GiftCampaignStatus, string> = {
  draft: "草稿",
  scheduled: "預約",
  published: "進行中",
  paused: "暫停",
  ended: "結束",
};
