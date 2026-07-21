export type UserRole =
  | "member"
  | "admin"
  | "store_staff"
  | "content_editor"
  | "customer_service"
  | "group_leader"
  | "promoter"
  | "livestream_host";

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "payment_reported"
  | "payment_confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"
  | "refunded";

export type OrderPaymentStatus =
  | "unpaid"
  | "paid_online"
  | "paid_store"
  | "failed"
  | "refunded"
  | "cancelled";

export type OrderPickupStatus =
  | "pending"
  | "ready"
  | "picked_up"
  | "returned"
  | "cancelled";

export type PaymentGateway = "ecpay" | "newebpay" | "bank_transfer" | "store_cash" | "manual";

export type ShipmentMethod = "store_pickup" | "home_delivery" | "cvs_pickup";

export type ShipmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "arrived"
  | "picked_up"
  | "returned";

export type CommissionRuleType =
  | "percentage"
  | "fixed_order"
  | "fixed_item"
  | "tiered_amount"
  | "tiered_quantity"
  | "manual";

export type CommissionTargetRole =
  | "member"
  | "group_leader"
  | "livestream_host"
  | "store_staff"
  | "promoter"
  | "custom";

export type CommissionCalculationBase =
  | "order_paid_amount"
  | "product_subtotal"
  | "gross_profit"
  | "after_discount"
  | "manual_amount";

export type CommissionSourceType =
  | "invite_link"
  | "product_share"
  | "group_share"
  | "video_share"
  | "livestream_share"
  | "referral_code"
  | "manual";

export type CommissionRecordStatus =
  | "pending_calculation"
  | "pending_review"
  | "approved"
  | "issued"
  | "rejected"
  | "cancelled"
  | "clawed_back";

export type PayoutMethod = "cash" | "store_credit" | "coupon" | "gift";

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  birthday: string | null;
  member_code: string;
  member_number?: string | null;
  role: UserRole;
  avatar_url: string | null;
  gender?: "female" | "male" | "other" | "prefer_not_to_say" | null;
  city?: string | null;
  district?: string | null;
  contact_address?: string | null;
  referrer_user_id: string | null;
  store_id: string | null;
  store_credit_balance?: number;
  is_active?: boolean;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active?: boolean;
  icon_emoji?: string | null;
  icon_url?: string | null;
  parent_id?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = "draft" | "active" | "inactive" | "sold_out";

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  category_id: string | null;
  status: ArticleStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_categories?: ProductCategory;
}

export type ContentPublishStatus = "draft" | "scheduled" | "published" | "archived";

export interface NewsCategoryRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  category_id: string | null;
  content: string | null;
  is_featured: boolean;
  is_important: boolean;
  status: ContentPublishStatus;
  published_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  related_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  news_categories?: NewsCategoryRow | null;
}

export interface CmsBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  mobile_image_url?: string | null;
  link_url: string | null;
  button_text?: string | null;
  badge_text?: string | null;
  placement?: string;
  status?: "draft" | "active" | "inactive";
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomeQuickMenuItemRow {
  id: string;
  title: string;
  icon_url: string | null;
  icon_key: string | null;
  link_url: string;
  link_target: "_self" | "_blank";
  alt_text: string | null;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomepageBlock {
  id: string;
  block_key: string;
  title: string;
  subtitle?: string | null;
  is_visible: boolean;
  sort_order: number;
  display_count?: number;
  source_mode?: "auto" | "manual";
  manual_ids?: string[];
  config?: Record<string, unknown>;
  updated_at: string;
}

export type FavoriteTargetType = "product" | "recipe" | "video";

export interface Favorite {
  id: string;
  user_id: string;
  target_type: FavoriteTargetType;
  target_id: string;
  created_at: string;
}

export interface MemberAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  postal_code: string | null;
  city: string;
  district: string;
  address_line: string;
  note?: string | null;
  label: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type MemberBenefitStatus = "draft" | "active" | "disabled";
export type MemberBenefitAssignmentStatus =
  | "available"
  | "used"
  | "expired"
  | "upcoming"
  | "disabled"
  | "revoked";

export interface MemberBenefit {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  image_url: string | null;
  usage_instructions: string | null;
  usage_location: string | null;
  status: MemberBenefitStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberBenefitAssignment {
  id: string;
  benefit_id: string;
  user_id: string;
  status: MemberBenefitAssignmentStatus;
  assigned_by: string | null;
  assigned_at: string;
  used_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  source: "manual" | "all_members" | "user_list" | "group_buy" | "campaign" | "course";
  note: string | null;
  created_at: string;
  updated_at: string;
  member_benefits?: MemberBenefit | null;
  profiles?: { id: string; full_name?: string | null; email?: string | null; phone?: string | null } | null;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug?: string | null;
  subtitle?: string | null;
  description: string | null;
  short_description?: string | null;
  specifications?: string | null;
  barcode?: string | null;
  sku?: string | null;
  unit?: string | null;
  video_url?: string | null;
  price: number;
  sale_price?: number | null;
  original_price: number | null;
  cost_price?: number | null;
  website_price?: number | null;
  group_buy_price?: number | null;
  msrp?: number | null;
  publish_website?: boolean;
  publish_group_buy?: boolean;
  publish_store?: boolean;
  stock: number;
  image_url: string | null;
  images?: string[];
  is_active: boolean;
  is_group_buy?: boolean;
  group_buy_start_at?: string | null;
  group_buy_end_at?: string | null;
  max_quantity_per_user?: number | null;
  supplier_name?: string | null;
  product_info?: string | null;
  pickup_store_ids?: string[];
  status?: ProductStatus;
  sort_order?: number;
  disclaimer: string | null;
  expected_arrival_date?: string | null;
  preorder_deadline?: string | null;
  created_at: string;
  updated_at: string;
  product_categories?: ProductCategory;
  product_channels?: Array<{ channel: string; is_enabled: boolean }>;
}

export interface GroupBuyEvent {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  banner_aspect_ratio?: string | null;
  is_homepage_featured?: boolean;
  homepage_sort_order?: number;
  linked_product_id?: string | null;
  start_at: string;
  end_at: string;
  status: "draft" | "active" | "ended" | "cancelled";
  leader_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupBuyProduct {
  id: string;
  group_buy_event_id: string;
  product_id: string;
  special_price: number | null;
  max_quantity: number | null;
  sold_count: number;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  notes?: string | null;
  business_hours?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_no?: string;
  pickup_token?: string | null;
  payment_status?: OrderPaymentStatus;
  pickup_status?: OrderPickupStatus;
  user_id: string;
  store_id: string | null;
  pickup_store_id?: string | null;
  group_buy_event_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  store_credit_used: number;
  total_amount: number;
  referral_code: string | null;
  share_source_type: CommissionSourceType | null;
  share_source_id: string | null;
  livestream_id: string | null;
  notes: string | null;
  /** 後台內部備註（非客戶可見） */
  admin_notes?: string | null;
  channel?: "website" | "group_buy" | "store_reservation" | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  stores?: Store;
  shipments?: Shipment[];
  payments?: OrderPayment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export type PickupLogAction = "lookup" | "confirm_payment" | "confirm_pickup" | "report_issue";

export type PickupLookupResult = {
  order_id: string;
  order_no: string;
  customer_name: string;
  phone_last_three: string;
  items: Array<{ product_name: string; quantity: number; subtotal: number }>;
  total_amount: number;
  payment_status: OrderPaymentStatus;
  pickup_status: OrderPickupStatus;
  order_status: string;
};

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  locked_price: number | null;
  group_buy_event_id: string | null;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  gateway_trade_no: string | null;
  merchant_trade_no: string | null;
  status: OrderPaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  method: ShipmentMethod;
  status: ShipmentStatus;
  store_id: string | null;
  tracking_no: string | null;
  carrier: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  address: string | null;
  cvs_store_id: string | null;
  shipped_at: string | null;
  arrived_at: string | null;
  picked_up_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stores?: Store;
}

export interface PaymentReport {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  last_five_digits: string | null;
  proof_image_url: string | null;
  status: "pending" | "confirmed" | "rejected";
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionRule {
  id: string;
  name: string;
  rule_type: CommissionRuleType;
  target_role: CommissionTargetRole;
  calculation_base: CommissionCalculationBase;
  percentage_rate: number | null;
  fixed_amount: number | null;
  tiers_json: Record<string, unknown>[] | null;
  product_id: string | null;
  group_buy_event_id: string | null;
  livestream_id: string | null;
  min_order_amount: number | null;
  max_commission_amount: number | null;
  monthly_cap_amount: number | null;
  total_commission_cap_rate: number | null;
  settlement_wait_days: number;
  is_multilevel_enabled: boolean;
  level_1_rate: number | null;
  level_2_rate: number | null;
  priority: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CommissionRecord {
  id: string;
  order_id: string;
  order_item_id: string | null;
  referrer_user_id: string;
  referred_user_id: string;
  commission_rule_id: string | null;
  commission_role: CommissionTargetRole;
  source_type: CommissionSourceType;
  source_id: string | null;
  level: number;
  order_amount: number;
  base_amount: number;
  commission_rate: number | null;
  commission_amount: number;
  status: CommissionRecordStatus;
  reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  issued_by: string | null;
  issued_at: string | null;
  payout_method: PayoutMethod | null;
  payout_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  product_id?: string | null;
  view_count: number;
  is_active: boolean;
  slug?: string | null;
  summary?: string | null;
  video_type?: "youtube" | "facebook" | "external" | "self_hosted" | null;
  duration_seconds?: number | null;
  category?: string | null;
  related_recipe_ids?: string[] | null;
  related_product_ids?: string[] | null;
  status?: "draft" | "scheduled" | "published" | "archived" | null;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  products?: Product | null;
}

export type RecipeDifficulty = "easy" | "medium" | "hard";

export interface RecipeCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  category_id: string | null;
  difficulty: RecipeDifficulty;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  servings: string | null;
  content: string | null;
  tips: string | null;
  storage_method: string | null;
  status: ContentPublishStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  related_video_id: string | null;
  sort_order: number;
  is_featured: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  recipe_categories?: RecipeCategory | null;
  recipe_ingredients?: RecipeIngredient[];
  recipe_steps?: RecipeStep[];
  videos?: Video | null;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  group_name: string | null;
  name: string;
  amount: string | null;
  unit: string | null;
  product_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  products?: Product | null;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  title: string | null;
  description: string;
  image_url: string | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Livestream {
  id: string;
  title: string;
  description: string | null;
  stream_url: string | null;
  thumbnail_url: string | null;
  host_user_id: string | null;
  status: "scheduled" | "live" | "ended";
  view_count?: number;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
  updated_at: string;
}

export type MemberNotificationCategory =
  | "order"
  | "pickup"
  | "product"
  | "livestream"
  | "system"
  | "group_buy"
  | "campaign"
  | "benefit"
  | "store";

export interface MemberNotification {
  id: string;
  user_id: string;
  notification_type: MemberNotificationCategory;
  title: string;
  summary?: string | null;
  message: string;
  link_url: string | null;
  reference_id: string | null;
  campaign_id?: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export type NotificationCampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";
export type NotificationAudienceType = "all" | "users" | "order_status";

export interface NotificationCampaign {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  category: MemberNotificationCategory;
  target_type: string | null;
  target_id: string | null;
  link_url: string | null;
  audience_type: NotificationAudienceType;
  audience_filter: Record<string, unknown>;
  status: NotificationCampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
  is_featured?: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupportSettings {
  id: string;
  settings_key: string;
  phone: string | null;
  email: string | null;
  line_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  address: string | null;
  business_hours: string | null;
  google_map_url: string | null;
  returns_info: string | null;
  shipping_info: string | null;
  support_info: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RewardRecord {
  id: string;
  user_id: string;
  reward_type: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "issued";
  source_type: string | null;
  source_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  issued_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  order_id: string | null;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export type MonsterShareStatus = "pending_review" | "approved" | "rejected";
export type MonsterRewardStatus = "pending_review" | "issued" | "used" | "expired";

export interface MonsterProfile {
  id: string;
  user_id: string;
  monster_name: string;
  bread_kg: number;
  level: number;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

export interface RewardRule {
  id: string;
  threshold_kg: number;
  reward_type: string;
  reward_name: string;
  reward_value: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonsterGameSettings {
  id: string;
  share_kg: number;
  min_chars: number;
  bonus_chars: number;
  bonus_kg: number;
  photo_kg: number;
  daily_limit: number;
  created_at: string;
  updated_at: string;
}

export interface ProductShareRecord {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  review_text: string;
  has_photo: boolean;
  line_share_text: string | null;
  share_url: string | null;
  bread_kg_awarded: number;
  status: MonsterShareStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  products?: Product | null;
  orders?: Order | null;
}

export interface MonsterFeedLog {
  id: string;
  user_id: string;
  product_id: string | null;
  order_id: string | null;
  share_record_id: string | null;
  bread_kg: number;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface MonsterReward {
  id: string;
  user_id: string;
  reward_rule_id: string;
  threshold_kg: number;
  reward_type: string;
  reward_name: string;
  reward_value: string | null;
  status: MonsterRewardStatus;
  issued_at: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineShareEvent {
  id: string;
  user_id: string;
  product_id: string | null;
  share_record_id: string | null;
  event_type: string;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface ShareableProduct {
  product_id: string;
  order_id: string;
  order_number: string;
  product_name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  share_status: "available" | "pending_review" | "approved" | "rejected";
  share_record_id?: string;
}
