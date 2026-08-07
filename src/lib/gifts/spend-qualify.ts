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

function qualificationAmount(campaign: GiftCampaign, order: OrderRow): number {
  const total = Number(order.total_amount ?? 0);
  const shipping = Number(order.shipping_fee ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  // Default: paid excluding shipping (discount already reflected in total when applicable)
  if (campaign.spend_calculation_type === "paid_incl_shipping") return total;
  if (campaign.spend_calculation_type === "pre_discount") {
    return Math.max(0, total + discount);
  }
  if (campaign.exclude_shipping) return Math.max(0, total - shipping);
  return total;
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
      : ["completed"];
    if (!required.includes(o.status)) continue;

    if (campaign.claim_start_at && now < new Date(campaign.claim_start_at)) continue;
    if (campaign.claim_end_at && now > new Date(campaign.claim_end_at)) continue;

    const purchaseStore = o.pickup_store_id || o.store_id || null;
    const purchaseStores = campaign.applicable_purchase_store_ids ?? [];
    if (purchaseStores.length > 0 && (!purchaseStore || !purchaseStores.includes(purchaseStore))) {
      continue;
    }

    const amount = qualificationAmount(campaign, o);
    const qty = giftQuantityForOrder(campaign, amount);
    if (qty <= 0) continue;
    if (availableQuantity(campaign) < qty) continue;

    const { count: memberCount } = await admin
      .from("member_gift_claims")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("member_id", o.user_id)
      .neq("status", "cancelled");
    if ((memberCount ?? 0) + qty > campaign.per_member_limit) continue;

    // Unique (order_id, campaign_id) — skip if already issued
    const { data: existing } = await admin
      .from("member_gift_claims")
      .select("id")
      .eq("source_order_id", o.id)
      .eq("campaign_id", campaign.id)
      .maybeSingle();
    if (existing) continue;

    if (campaign.inventory_reservation_mode === "reserve_on_claim") {
      const { data: reservedRows, error: rErr } = await admin
        .from("gift_campaigns")
        .update({
          reserved_quantity: campaign.reserved_quantity + qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .eq("reserved_quantity", campaign.reserved_quantity)
        .eq("redeemed_quantity", campaign.redeemed_quantity)
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
        issue_sequence: 1,
        redemption_code: generateRedemptionCode(),
        status: "available",
        expires_at: campaign.redeem_end_at,
        purchase_store_id: purchaseStore,
      })
      .select("*, gift_campaigns(*)")
      .single();

    if (iErr) {
      if (campaign.inventory_reservation_mode === "reserve_on_claim") {
        await admin
          .from("gift_campaigns")
          .update({
            reserved_quantity: Math.max(0, campaign.reserved_quantity),
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
      action: "qualify_spend_gift",
      result: "success",
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

  // Mark already-redeemed as needing manual review (do not delete)
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
