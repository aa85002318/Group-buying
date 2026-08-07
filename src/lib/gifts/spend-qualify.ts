import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import { generateRedemptionCode } from "@/lib/gifts/qr-token";
import type { GiftCampaign, MemberGiftClaim } from "@/lib/gifts/types";

type OrderRow = {
  id: string;
  user_id: string | null;
  status: string;
  total_amount?: number | null;
  subtotal?: number | null;
  shipping_fee?: number | null;
  discount_amount?: number | null;
  store_id?: string | null;
  pickup_store_id?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
};

type OrderItemRow = {
  product_id: string;
  subtotal: number;
  quantity: number;
  unit_price: number;
  products?: { category_id?: string | null } | null;
};

function orderTotalFallback(campaign: GiftCampaign, order: OrderRow): number {
  const total = Number(order.total_amount ?? 0);
  const shipping = Number(order.shipping_fee ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  if (campaign.spend_calculation_type === "paid_incl_shipping") return total;
  if (campaign.spend_calculation_type === "pre_discount") {
    return Math.max(0, total + discount);
  }
  if (campaign.exclude_shipping !== false) return Math.max(0, total - shipping);
  return total;
}

/** 依指定／排除商品與分類計算可計入滿額金額 */
export function qualificationAmountFromItems(
  campaign: GiftCampaign,
  order: OrderRow,
  items: OrderItemRow[]
): number {
  const includeProducts = campaign.applicable_product_ids ?? [];
  const includeCategories = campaign.applicable_category_ids ?? [];
  const excludeProducts = campaign.excluded_product_ids ?? [];
  const hasFilters =
    includeProducts.length > 0 || includeCategories.length > 0 || excludeProducts.length > 0;

  if (!hasFilters || items.length === 0) {
    return orderTotalFallback(campaign, order);
  }

  let sum = 0;
  const hasInclude = includeProducts.length > 0 || includeCategories.length > 0;

  for (const item of items) {
    if (excludeProducts.includes(item.product_id)) continue;
    if (!hasInclude) {
      sum += Number(item.subtotal ?? 0);
      continue;
    }
    const catId = item.products?.category_id ?? null;
    const productHit =
      includeProducts.length > 0 && includeProducts.includes(item.product_id);
    const categoryHit =
      includeCategories.length > 0 && catId != null && includeCategories.includes(catId);
    if (productHit || categoryHit) {
      sum += Number(item.subtotal ?? 0);
    }
  }

  if (campaign.exclude_coupons) {
    // 粗略：依訂單折價比例攤到計入金額
    const orderSub = Number(order.subtotal ?? sum);
    const discount = Number(order.discount_amount ?? 0);
    if (orderSub > 0 && discount > 0) {
      sum = Math.max(0, sum - (sum / orderSub) * discount);
    }
  }

  return Math.max(0, Math.round(sum * 100) / 100);
}

function giftQuantityForOrder(campaign: GiftCampaign, amount: number): number {
  const min = Number(campaign.minimum_spend ?? 0);
  if (min <= 0 || amount < min) return 0;
  if (!campaign.is_stackable) {
    return Math.min(campaign.per_order_quantity, campaign.stack_limit ?? campaign.per_order_quantity);
  }
  const stacks = Math.floor(amount / min);
  const capped = campaign.stack_limit != null ? Math.min(stacks, campaign.stack_limit) : stacks;
  return Math.max(0, capped * campaign.per_order_quantity);
}

function orderInClaimWindow(campaign: GiftCampaign, order: OrderRow): boolean {
  const t = new Date(order.completed_at || order.updated_at || Date.now()).getTime();
  if (campaign.claim_start_at && t < new Date(campaign.claim_start_at).getTime()) return false;
  if (campaign.claim_end_at && t > new Date(campaign.claim_end_at).getTime()) return false;
  return true;
}

async function sumPeriodQualification(
  admin: ReturnType<typeof createAdminClient>,
  campaign: GiftCampaign,
  memberId: string,
  requiredStatuses: string[]
): Promise<number> {
  let q = admin
    .from("orders")
    .select(
      "id, user_id, status, total_amount, subtotal, shipping_fee, discount_amount, store_id, pickup_store_id, completed_at, updated_at"
    )
    .eq("user_id", memberId)
    .in("status", requiredStatuses);

  if (campaign.claim_start_at) {
    q = q.gte("completed_at", campaign.claim_start_at);
  }
  if (campaign.claim_end_at) {
    q = q.lte("completed_at", campaign.claim_end_at);
  }

  const { data: orders } = await q.limit(200);
  const purchaseStores = campaign.applicable_purchase_store_ids ?? [];
  const excludedStores = campaign.excluded_store_ids ?? [];
  let total = 0;

  for (const raw of orders ?? []) {
    const ord = raw as OrderRow;
    if (!orderInClaimWindow(campaign, ord)) continue;
    const purchaseStore = ord.pickup_store_id || ord.store_id || null;
    if (purchaseStores.length > 0 && (!purchaseStore || !purchaseStores.includes(purchaseStore))) {
      continue;
    }
    if (purchaseStore && excludedStores.includes(purchaseStore)) continue;

    const { data: itemRows } = await admin
      .from("order_items")
      .select("product_id, subtotal, quantity, unit_price, products:product_id(category_id)")
      .eq("order_id", ord.id);
    total += qualificationAmountFromItems(campaign, ord, (itemRows ?? []) as OrderItemRow[]);
  }

  return Math.round(total * 100) / 100;
}

/** Create store-spend gift claims from a qualifying completed order. */
export async function qualifySpendGiftsForOrder(orderId: string): Promise<MemberGiftClaim[]> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, user_id, status, total_amount, subtotal, shipping_fee, discount_amount, store_id, pickup_store_id, completed_at, updated_at"
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order?.user_id) return [];

  const o = order as OrderRow;
  const { data: itemRows } = await admin
    .from("order_items")
    .select("product_id, subtotal, quantity, unit_price, products:product_id(category_id)")
    .eq("order_id", orderId);

  const items = (itemRows ?? []) as OrderItemRow[];

  const { data: campaigns } = await admin
    .from("gift_campaigns")
    .select("*")
    .eq("campaign_type", "store_spend_gift")
    .eq("status", "published");

  const created: MemberGiftClaim[] = [];
  const now = new Date();

  for (const raw of campaigns ?? []) {
    const campaign = raw as GiftCampaign;
    const required = campaign.required_order_statuses?.length
      ? campaign.required_order_statuses
      : ["completed", "ready_for_pickup", "paid"];
    if (!required.includes(o.status)) continue;

    if (campaign.claim_start_at && now < new Date(campaign.claim_start_at)) continue;
    if (campaign.claim_end_at && now > new Date(campaign.claim_end_at)) continue;

    const purchaseStore = o.pickup_store_id || o.store_id || null;
    const purchaseStores = campaign.applicable_purchase_store_ids ?? [];
    if (purchaseStores.length > 0 && (!purchaseStore || !purchaseStores.includes(purchaseStore))) {
      continue;
    }
    const excludedStores = campaign.excluded_store_ids ?? [];
    if (purchaseStore && excludedStores.includes(purchaseStore)) continue;

    const periodMode = campaign.spend_mode === "period_accumulate";
    let amount = qualificationAmountFromItems(campaign, o, items);
    let qty = giftQuantityForOrder(campaign, amount);

    if (periodMode) {
      amount = await sumPeriodQualification(admin, campaign, o.user_id!, required);
      const earned = giftQuantityForOrder(campaign, amount);
      const { data: priorClaims } = await admin
        .from("member_gift_claims")
        .select("quantity, status")
        .eq("campaign_id", campaign.id)
        .eq("member_id", o.user_id)
        .neq("status", "cancelled");
      const issued = (priorClaims ?? []).reduce((s, c) => s + Number(c.quantity ?? 0), 0);
      qty = Math.max(0, earned - issued);
    }

    if (qty <= 0) continue;
    if (availableQuantity(campaign) < qty) continue;

    const { data: memberClaims } = await admin
      .from("member_gift_claims")
      .select("id, quantity, issue_sequence")
      .eq("campaign_id", campaign.id)
      .eq("member_id", o.user_id)
      .neq("status", "cancelled");
    const memberQty = (memberClaims ?? []).reduce((s, c) => s + Number(c.quantity ?? 0), 0);
    if (memberQty + qty > campaign.per_member_limit) {
      qty = Math.max(0, campaign.per_member_limit - memberQty);
    }
    if (qty <= 0) continue;

    // 單筆模式：同一訂單不可重複發放
    if (!periodMode) {
      const { data: existing } = await admin
        .from("member_gift_claims")
        .select("id")
        .eq("source_order_id", o.id)
        .eq("campaign_id", campaign.id)
        .maybeSingle();
      if (existing) continue;
    } else {
      // 期間累積：同一訂單仍只觸發一次補發（避免重複 webhook）
      const { data: existing } = await admin
        .from("member_gift_claims")
        .select("id")
        .eq("source_order_id", o.id)
        .eq("campaign_id", campaign.id)
        .maybeSingle();
      if (existing) continue;
    }

    const maxSeq = (memberClaims ?? []).reduce(
      (m, c) => Math.max(m, Number(c.issue_sequence ?? 0)),
      0
    );
    const issue_sequence = maxSeq + 1;

    // Refresh reserved baseline from DB before optimistic update
    const { data: fresh } = await admin
      .from("gift_campaigns")
      .select("reserved_quantity, redeemed_quantity, total_quantity")
      .eq("id", campaign.id)
      .maybeSingle();
    const reserved = Number(fresh?.reserved_quantity ?? campaign.reserved_quantity);
    const redeemed = Number(fresh?.redeemed_quantity ?? campaign.redeemed_quantity);

    if (campaign.inventory_reservation_mode === "reserve_on_claim") {
      const { data: reservedRows, error: rErr } = await admin
        .from("gift_campaigns")
        .update({
          reserved_quantity: reserved + qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .eq("reserved_quantity", reserved)
        .eq("redeemed_quantity", redeemed)
        .select("id");
      if (rErr || !reservedRows?.length) continue;
    }

    const { data: claim, error: iErr } = await admin
      .from("member_gift_claims")
      .insert({
        campaign_id: campaign.id,
        member_id: o.user_id,
        source_order_id: o.id,
        qualification_amount: amount,
        quantity: qty,
        issue_sequence,
        redemption_code: generateRedemptionCode(),
        status: "available",
        expires_at: campaign.redeem_end_at,
        purchase_store_id: purchaseStore,
        designated_store_id: campaign.require_same_store_redeem ? purchaseStore : null,
      })
      .select("*, gift_campaigns(*)")
      .single();

    if (iErr) {
      if (campaign.inventory_reservation_mode === "reserve_on_claim") {
        await admin
          .from("gift_campaigns")
          .update({
            reserved_quantity: Math.max(0, reserved),
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);
      }
      continue;
    }

    await admin.from("gift_redemption_logs").insert({
      claim_id: claim.id,
      campaign_id: campaign.id,
      member_id: o.user_id,
      order_id: o.id,
      store_id: purchaseStore,
      action: periodMode ? "qualify_spend_gift_period" : "qualify_spend_gift",
      result: "success",
      meta: {
        qualification_amount: amount,
        quantity: qty,
        spend_mode: campaign.spend_mode ?? "single_order",
      },
    });

    created.push(claim as MemberGiftClaim);
  }

  return created;
}

/** Cancel unused spend-gift claims when order is cancelled/refunded. */
export async function cancelSpendGiftsForOrder(
  orderId: string,
  reason: string
): Promise<void> {
  const admin = createAdminClient();
  const { data: claims } = await admin
    .from("member_gift_claims")
    .select("*, gift_campaigns(inventory_reservation_mode)")
    .eq("source_order_id", orderId)
    .eq("status", "available");

  for (const claim of claims ?? []) {
    const { error } = await admin
      .from("member_gift_claims")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.id)
      .eq("status", "available");
    if (error) continue;

    const mode = (claim.gift_campaigns as { inventory_reservation_mode?: string } | null)
      ?.inventory_reservation_mode;
    if (mode === "reserve_on_claim") {
      const { data: campaign } = await admin
        .from("gift_campaigns")
        .select("id, reserved_quantity")
        .eq("id", claim.campaign_id)
        .maybeSingle();
      if (campaign) {
        await admin
          .from("gift_campaigns")
          .update({
            reserved_quantity: Math.max(0, Number(campaign.reserved_quantity) - Number(claim.quantity)),
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);
      }
    }

    await admin.from("gift_redemption_logs").insert({
      claim_id: claim.id,
      campaign_id: claim.campaign_id,
      member_id: claim.member_id,
      order_id: orderId,
      action: "cancel_on_order",
      result: "success",
      failure_reason: reason,
    });
  }

  const { data: redeemed } = await admin
    .from("member_gift_claims")
    .select("id, campaign_id, member_id")
    .eq("source_order_id", orderId)
    .eq("status", "redeemed");

  for (const claim of redeemed ?? []) {
    await admin.from("gift_redemption_logs").insert({
      claim_id: claim.id,
      campaign_id: claim.campaign_id,
      member_id: claim.member_id,
      order_id: orderId,
      action: "order_cancelled_after_redeem",
      result: "anomaly",
      failure_reason: reason,
    });
  }
}
