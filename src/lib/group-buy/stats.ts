import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

/** Orders that should NOT count toward group-buy stats. */
const EXCLUDED_STATUSES = new Set([
  "cancelled",
  "refunded",
  "pending",
]);

const EXCLUDED_PAYMENT = new Set(["failed", "refunded", "cancelled"]);

export type GroupBuyEventStats = {
  eventId: string;
  /** Distinct paying members (user_id) */
  memberCount: number;
  /** Count of effective orders */
  orderCount: number;
  /** Sum of line quantities for this event */
  soldQty: number;
  /** Sum of order totals */
  amountTotal: number;
};

function isEffectiveOrder(row: {
  status?: string | null;
  payment_status?: string | null;
}): boolean {
  if (EXCLUDED_STATUSES.has(String(row.status ?? ""))) return false;
  if (EXCLUDED_PAYMENT.has(String(row.payment_status ?? ""))) return false;
  // Unpaid awaiting payment still counting as "跟團"? Spec says exclude 待付款逾期 / 付款失敗.
  // Keep awaiting_payment / payment_reported as tentative participants (common for group buys).
  return true;
}

/**
 * Aggregate effective order stats per group_buy_event_id.
 * Falls back to empty map when orders table / columns unavailable.
 */
export async function getGroupBuyEventStatsMap(
  eventIds: string[]
): Promise<Map<string, GroupBuyEventStats>> {
  const map = new Map<string, GroupBuyEventStats>();
  for (const id of eventIds) {
    map.set(id, {
      eventId: id,
      memberCount: 0,
      orderCount: 0,
      soldQty: 0,
      amountTotal: 0,
    });
  }
  if (!eventIds.length || !isSupabaseConfigured()) return map;

  try {
    const admin = createAdminClient();
    const { data: orders, error } = await admin
      .from("orders")
      .select("id, user_id, group_buy_event_id, status, payment_status, total_amount")
      .in("group_buy_event_id", eventIds);

    if (error || !orders?.length) return map;

    const effective = orders.filter(isEffectiveOrder);
    const orderIds = effective.map((o) => o.id);
    const membersByEvent = new Map<string, Set<string>>();
    const qtyByEvent = new Map<string, number>();

    for (const o of effective) {
      const eid = String(o.group_buy_event_id);
      const cur = map.get(eid);
      if (!cur) continue;
      cur.orderCount += 1;
      cur.amountTotal += Number(o.total_amount ?? 0);
      if (!membersByEvent.has(eid)) membersByEvent.set(eid, new Set());
      if (o.user_id) membersByEvent.get(eid)!.add(String(o.user_id));
    }

    if (orderIds.length) {
      const { data: items } = await admin
        .from("order_items")
        .select("order_id, quantity")
        .in("order_id", orderIds);
      const orderToEvent = new Map(
        effective.map((o) => [o.id, String(o.group_buy_event_id)] as const)
      );
      for (const item of items ?? []) {
        const eid = orderToEvent.get(item.order_id);
        if (!eid) continue;
        qtyByEvent.set(eid, (qtyByEvent.get(eid) ?? 0) + Number(item.quantity ?? 0));
      }
    }

    for (const [eid, stats] of Array.from(map.entries())) {
      stats.memberCount = membersByEvent.get(eid)?.size ?? 0;
      stats.soldQty = qtyByEvent.get(eid) ?? 0;
    }
  } catch {
    // soft fail
  }

  return map;
}

export type DisplayStatResult = {
  participantCount: number;
  /** Real sold qty from effective orders (or sold_count fallback) */
  realSoldQuantity: number;
  /** Admin virtual boost */
  virtualSoldQuantity: number;
  /** Displayed sold = real + virtual */
  soldQuantity: number;
  hide: boolean;
  showVirtualLabel: boolean;
};

export function pickDisplayStat(
  stats: GroupBuyEventStats | undefined,
  mode: string | null | undefined,
  soldCountFallback: number,
  opts?: {
    virtualSoldQty?: number | null;
    showVirtualSalesLabel?: boolean | null;
  }
): DisplayStatResult {
  const virtual = Math.max(0, Number(opts?.virtualSoldQty ?? 0));
  const showVirtualLabel = opts?.showVirtualSalesLabel !== false && virtual > 0;

  if (mode === "hidden") {
    return {
      participantCount: 0,
      realSoldQuantity: 0,
      virtualSoldQuantity: 0,
      soldQuantity: 0,
      hide: true,
      showVirtualLabel: false,
    };
  }

  let participantCount = soldCountFallback;
  let realSold = soldCountFallback;

  if (stats) {
    switch (mode) {
      case "members":
        participantCount = stats.memberCount;
        realSold = stats.soldQty;
        break;
      case "qty":
        participantCount = stats.soldQty;
        realSold = stats.soldQty;
        break;
      case "orders":
      default:
        participantCount = stats.orderCount;
        realSold = stats.soldQty || soldCountFallback;
        break;
    }
  }

  return {
    participantCount,
    realSoldQuantity: realSold,
    virtualSoldQuantity: virtual,
    soldQuantity: realSold + virtual,
    hide: false,
    showVirtualLabel,
  };
}
