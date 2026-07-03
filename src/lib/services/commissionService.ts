/**
 * Commission Service - 分潤計算引擎
 * Handles attribution, rule selection, calculation, caps, and multilevel commissions.
 */

import { createAdminClient } from "@/lib/supabase/admin";
export interface OrderForCommission {
  id: string;
  user_id: string;
  subtotal: number;
  discount_amount: number;
  store_credit_used: number;
  shipping_fee: number;
  total_amount: number;
  referral_code?: string | null;
  share_source_type?: string | null;
  share_source_id?: string | null;
  livestream_id?: string | null;
  referrer_user_id?: string | null;
  group_buy_event_id?: string | null;
  status: string;
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    group_buy_product_id?: string | null;
  }>;
}

export interface AttributionResult {
  referrer_user_id: string;
  referred_user_id: string;
  source_type: string;
  source_id?: string;
  level: number;
  reason: string;
}

export interface CommissionRule {
  id: string;
  name: string;
  rule_type: string;
  target_role: string;
  calculation_base: string;
  percentage_rate?: number | null;
  fixed_amount?: number | null;
  tiers_json?: unknown;
  product_id?: string | null;
  group_buy_event_id?: string | null;
  livestream_id?: string | null;
  min_order_amount?: number | null;
  max_commission_amount?: number | null;
  monthly_cap_amount?: number | null;
  total_commission_cap_rate?: number | null;
  settlement_wait_days: number;
  is_multilevel_enabled: boolean;
  level_1_rate?: number | null;
  level_2_rate?: number | null;
  priority: number;
  status: string;
}

export function calculateBaseAmount(
  order: OrderForCommission,
  refundAmount = 0
): number {
  const discount = order.discount_amount ?? (order as { discount?: number }).discount ?? 0;
  const base = order.subtotal - discount - order.store_credit_used - refundAmount;
  return Math.max(0, base);
}

export function calculateCommissionAmount(
  rule: CommissionRule,
  baseAmount: number,
  itemQuantity?: number
): { amount: number; rate: number | null; reason: string } {
  switch (rule.rule_type) {
    case "percentage": {
      const rate = Number(rule.percentage_rate ?? 0);
      const amount = baseAmount * (rate / 100);
      return { amount, rate, reason: `百分比 ${rate}% × 基數 ${baseAmount}` };
    }
    case "fixed_order": {
      const amount = Number(rule.fixed_amount ?? 0);
      return { amount, rate: null, reason: `固定訂單分潤 ${amount}` };
    }
    case "fixed_item": {
      const amount = Number(rule.fixed_amount ?? 0) * (itemQuantity ?? 1);
      return { amount, rate: null, reason: `固定單品分潤 ${rule.fixed_amount} × ${itemQuantity}` };
    }
    case "tiered_amount": {
      const tiers = (rule.tiers_json as Array<{ min: number; rate: number }>) ?? [];
      const sorted = [...tiers].sort((a, b) => b.min - a.min);
      const tier = sorted.find((t) => baseAmount >= t.min);
      if (!tier) return { amount: 0, rate: 0, reason: "未達階梯門檻" };
      const amount = baseAmount * (tier.rate / 100);
      return { amount, rate: tier.rate, reason: `階梯金額 ${tier.min}+ @ ${tier.rate}%` };
    }
    case "tiered_quantity": {
      const tiers = (rule.tiers_json as Array<{ min: number; rate: number }>) ?? [];
      const qty = itemQuantity ?? 1;
      const sorted = [...tiers].sort((a, b) => b.min - a.min);
      const tier = sorted.find((t) => qty >= t.min);
      if (!tier) return { amount: 0, rate: 0, reason: "未達數量階梯" };
      const amount = baseAmount * (tier.rate / 100);
      return { amount, rate: tier.rate, reason: `階梯數量 ${tier.min}+ @ ${tier.rate}%` };
    }
    case "manual":
      return { amount: 0, rate: null, reason: "手動分潤，需管理員設定" };
    default:
      return { amount: 0, rate: null, reason: "未知規則類型" };
  }
}

export async function determineAttribution(
  order: OrderForCommission
): Promise<AttributionResult[]> {
  const admin = createAdminClient();
  const results: AttributionResult[] = [];

  // Self-referral check helper
  const isSelfReferral = (referrerId: string) => referrerId === order.user_id;

  // 1. Checkout referral code
  if (order.referral_code) {
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("member_code", order.referral_code)
      .single();
    if (referrer && !isSelfReferral(referrer.id)) {
      results.push({
        referrer_user_id: referrer.id,
        referred_user_id: order.user_id,
        source_type: "referral_code",
        source_id: order.referral_code,
        level: 1,
        reason: "結帳推薦碼",
      });
      return results;
    }
  }

  // 2. Last clicked share link
  const { data: lastClick } = await admin
    .from("share_clicks")
    .select("sharer_user_id, share_type, target_id, ref_code")
    .eq("visitor_id", order.user_id)
    .order("clicked_at", { ascending: false })
    .limit(1)
    .single();

  if (lastClick && !isSelfReferral(lastClick.sharer_user_id)) {
    const sourceTypeMap: Record<string, string> = {
      product: "product_share",
      group: "group_share",
      video: "video_share",
      livestream: "livestream_share",
    };
    results.push({
      referrer_user_id: lastClick.sharer_user_id,
      referred_user_id: order.user_id,
      source_type: sourceTypeMap[lastClick.share_type] ?? "invite_link",
      source_id: lastClick.target_id,
      level: 1,
      reason: "最後點擊分享連結",
    });
    return results;
  }

  // 3. Registration referrer
  if (order.referrer_user_id && !isSelfReferral(order.referrer_user_id)) {
    results.push({
      referrer_user_id: order.referrer_user_id,
      referred_user_id: order.user_id,
      source_type: "invite_link",
      level: 1,
      reason: "註冊推薦人",
    });
    return results;
  }

  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("referrer_user_id")
    .eq("id", order.user_id)
    .single();

  if (buyerProfile?.referrer_user_id && !isSelfReferral(buyerProfile.referrer_user_id)) {
    results.push({
      referrer_user_id: buyerProfile.referrer_user_id,
      referred_user_id: order.user_id,
      source_type: "invite_link",
      level: 1,
      reason: "註冊推薦人",
    });
    return results;
  }

  // 4. Livestream source
  if (order.livestream_id) {
    const { data: stream } = await admin
      .from("livestreams")
      .select("host_user_id")
      .eq("id", order.livestream_id)
      .single();
    if (stream?.host_user_id && !isSelfReferral(stream.host_user_id)) {
      results.push({
        referrer_user_id: stream.host_user_id,
        referred_user_id: order.user_id,
        source_type: "livestream_share",
        source_id: order.livestream_id,
        level: 1,
        reason: "直播來源",
      });
      return results;
    }
  }

  return results;
}

/** Alias per spec: determineCommissionRecipient */
export const determineCommissionRecipient = determineAttribution;

export async function selectApplicableRules(
  order: OrderForCommission
): Promise<CommissionRule[]> {
  const admin = createAdminClient();
  const { data: rules } = await admin
    .from("commission_rules")
    .select("*")
    .eq("status", "active")
    .order("priority", { ascending: true });

  if (!rules) return [];

  const baseAmount = calculateBaseAmount(order);

  return (rules as CommissionRule[]).filter((rule) => {
    if (rule.min_order_amount && baseAmount < rule.min_order_amount) return false;
    if (rule.group_buy_event_id && rule.group_buy_event_id !== order.group_buy_event_id) return false;
    if (rule.livestream_id && rule.livestream_id !== order.livestream_id) return false;
    if (rule.product_id) {
      const hasProduct = order.items.some((i) => i.product_id === rule.product_id);
      if (!hasProduct) return false;
    }
    return true;
  });
}

export async function checkCaps(
  referrerUserId: string,
  amount: number,
  rule: CommissionRule
): Promise<{ amount: number; reason: string }> {
  let finalAmount = amount;
  let reason = "";

  if (rule.max_commission_amount && finalAmount > rule.max_commission_amount) {
    finalAmount = rule.max_commission_amount;
    reason += `單筆上限 ${rule.max_commission_amount}; `;
  }

  if (rule.monthly_cap_amount) {
    const admin = createAdminClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyTotal } = await admin
      .from("commission_records")
      .select("commission_amount")
      .eq("referrer_user_id", referrerUserId)
      .gte("created_at", startOfMonth.toISOString())
      .not("status", "in", "(rejected,cancelled,clawed_back)");

    const total = (monthlyTotal ?? []).reduce((s, r) => s + Number(r.commission_amount), 0);
    const remaining = rule.monthly_cap_amount - total;
    if (remaining <= 0) {
      return { amount: 0, reason: "已達月上限" };
    }
    if (finalAmount > remaining) {
      finalAmount = remaining;
      reason += `月上限調整; `;
    }
  }

  return { amount: finalAmount, reason };
}

export async function processOrderCommissions(orderId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "completed") return;

  const orderForCommission: OrderForCommission = {
    ...order,
    items: order.order_items ?? [],
  };

  const attributions = await determineAttribution(orderForCommission);
  if (attributions.length === 0) return;

  const baseAmount = calculateBaseAmount(orderForCommission);

  for (const attribution of attributions) {
    const rules = await selectApplicableRules(orderForCommission);
    if (rules.length === 0) continue;

    const rule = rules[0];
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + (rule.settlement_wait_days ?? 7));

    const { amount, rate, reason: calcReason } = calculateCommissionAmount(rule, baseAmount);
    const { amount: cappedAmount, reason: capReason } = await checkCaps(
      attribution.referrer_user_id,
      amount,
      rule
    );

    if (cappedAmount <= 0) continue;

    await admin.from("commission_records").insert({
      order_id: orderId,
      referrer_user_id: attribution.referrer_user_id,
      referred_user_id: attribution.referred_user_id,
      commission_rule_id: rule.id,
      commission_role: rule.target_role,
      source_type: attribution.source_type,
      source_id: attribution.source_id,
      level: attribution.level,
      order_amount: order.total_amount,
      base_amount: baseAmount,
      commission_rate: rate,
      commission_amount: cappedAmount,
      status: "pending_review",
      reason: `${attribution.reason}; ${calcReason}; ${capReason}`,
    });

    // Level 2 multilevel
    if (rule.is_multilevel_enabled && rule.level_2_rate) {
      const { data: level1Profile } = await admin
        .from("profiles")
        .select("referrer_user_id")
        .eq("id", attribution.referrer_user_id)
        .single();

      if (level1Profile?.referrer_user_id && level1Profile.referrer_user_id !== order.user_id) {
        const level2Amount = cappedAmount * (Number(rule.level_2_rate) / 100);
        await admin.from("commission_records").insert({
          order_id: orderId,
          referrer_user_id: level1Profile.referrer_user_id,
          referred_user_id: attribution.referred_user_id,
          commission_rule_id: rule.id,
          commission_role: rule.target_role,
          source_type: attribution.source_type,
          source_id: attribution.source_id,
          level: 2,
          order_amount: order.total_amount,
          base_amount: baseAmount,
          commission_rate: rule.level_2_rate,
          commission_amount: level2Amount,
          status: "pending_review",
          reason: `二級分潤 ${rule.level_2_rate}%`,
        });
      }
    }
  }
}

export async function clawbackCommissions(
  orderId: string,
  reason: string,
  refundAmount?: number
): Promise<void> {
  const admin = createAdminClient();
  const clawReason = refundAmount
    ? `${reason}（退款金額 ${refundAmount}）`
    : reason;

  await admin
    .from("commission_records")
    .update({ status: "clawed_back", reason: clawReason })
    .eq("order_id", orderId)
    .in("status", ["pending_calculation", "pending_review", "approved", "issued"]);

  if (refundAmount && refundAmount > 0) {
    const { data: records } = await admin
      .from("commission_records")
      .select("*")
      .eq("order_id", orderId)
      .eq("status", "issued");

    for (const record of records ?? []) {
      const { data: order } = await admin
        .from("orders")
        .select("subtotal, discount_amount, store_credit_used")
        .eq("id", orderId)
        .single();
      if (!order) continue;
      const newBase = calculateBaseAmount(
        {
          subtotal: Number(order.subtotal),
          discount_amount: Number(order.discount_amount),
          store_credit_used: Number(order.store_credit_used),
        } as OrderForCommission,
        refundAmount
      );
      const adjusted = Math.max(0, Number(record.commission_amount) - refundAmount * 0.05);
      if (adjusted < Number(record.commission_amount)) {
        await admin
          .from("commission_records")
          .update({
            base_amount: newBase,
            commission_amount: adjusted,
            reason: `${record.reason ?? ""}; 部分追回`,
          })
          .eq("id", record.id);
      }
    }
  }
}

export async function cancelCommissions(orderId: string, reason: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("commission_records")
    .update({ status: "cancelled", reason })
    .eq("order_id", orderId)
    .in("status", ["pending_calculation", "pending_review", "approved"]);
}
