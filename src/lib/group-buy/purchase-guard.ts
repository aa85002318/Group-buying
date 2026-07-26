import { computeGroupBuyRuntimeStatus } from "@/lib/group-buy/page-settings";
import { getGroupBuyPageSettings } from "@/lib/group-buy/settings-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export type GroupBuyPurchaseCheck =
  | { ok: true; runtimeStatus: string; priorQty: number }
  | { ok: false; code: string; message: string };

const EXCLUDED_ORDER_STATUSES = new Set(["cancelled", "refunded"]);
const EXCLUDED_PAYMENT = new Set(["failed", "refunded", "cancelled"]);

/**
 * Sum quantities this user already ordered for an event (effective orders only).
 * Excludes cancelled / refunded / payment-failed.
 */
export async function getUserGroupBuyPurchasedQty(
  eventId: string,
  userId: string
): Promise<number> {
  if (!isSupabaseConfigured() || !userId) return 0;

  try {
    const admin = createAdminClient();
    const { data: orders, error } = await admin
      .from("orders")
      .select("id, status, payment_status")
      .eq("group_buy_event_id", eventId)
      .eq("user_id", userId);

    if (error || !orders?.length) return 0;

    const effectiveIds = orders
      .filter((o) => {
        if (EXCLUDED_ORDER_STATUSES.has(String(o.status ?? ""))) return false;
        if (EXCLUDED_PAYMENT.has(String(o.payment_status ?? ""))) return false;
        return true;
      })
      .map((o) => o.id);

    if (!effectiveIds.length) return 0;

    const { data: items } = await admin
      .from("order_items")
      .select("quantity")
      .in("order_id", effectiveIds);

    return (items ?? []).reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Server-side gate for group-buy purchases.
 * Call from createOrder when groupBuyEventId is present.
 * Enforces per-user max across prior effective orders + this cart.
 */
export async function assertGroupBuyPurchasable(
  eventId: string,
  opts?: { productId?: string; quantity?: number; userId?: string }
): Promise<GroupBuyPurchaseCheck> {
  if (!isSupabaseConfigured()) {
    return { ok: true, runtimeStatus: "active", priorQty: 0 };
  }

  const admin = createAdminClient();
  const settings = await getGroupBuyPageSettings();

  const { data: event, error } = await admin
    .from("group_buy_events")
    .select(
      "id, status, start_at, end_at, max_qty_per_user, min_qty, group_buy_products(id, product_id, max_quantity, sold_count)"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return { ok: false, code: "EVENT_NOT_FOUND", message: "團購活動不存在" };
  }

  if (event.status === "draft" || event.status === "cancelled") {
    return { ok: false, code: "EVENT_INACTIVE", message: "此團購尚未開放或已取消" };
  }

  const runtime = computeGroupBuyRuntimeStatus({
    status: event.status,
    start_at: event.start_at,
    end_at: event.end_at,
    endingSoonHours: settings.endingSoonHours,
  });

  if (runtime === "upcoming") {
    return { ok: false, code: "NOT_STARTED", message: "團購尚未開始，無法購買" };
  }
  if (runtime === "ended") {
    return { ok: false, code: "ENDED", message: "團購已結團，無法購買" };
  }

  const qty = Math.max(1, Number(opts?.quantity ?? 1));
  if (event.min_qty != null && qty < Number(event.min_qty)) {
    return {
      ok: false,
      code: "MIN_QTY",
      message: `最低購買數量為 ${event.min_qty}`,
    };
  }

  let priorQty = 0;
  if (opts?.userId && event.max_qty_per_user != null) {
    priorQty = await getUserGroupBuyPurchasedQty(eventId, opts.userId);
    const max = Number(event.max_qty_per_user);
    const remaining = Math.max(0, max - priorQty);
    if (qty > remaining) {
      return {
        ok: false,
        code: "MAX_QTY",
        message:
          priorQty > 0
            ? `每人限購 ${max} 件，您已購買 ${priorQty} 件，本次最多還可買 ${remaining} 件`
            : `每人限購 ${max} 件`,
      };
    }
  } else if (event.max_qty_per_user != null && qty > Number(event.max_qty_per_user)) {
    return {
      ok: false,
      code: "MAX_QTY",
      message: `每人限購 ${event.max_qty_per_user} 件`,
    };
  }

  if (opts?.productId) {
    const lines = (event.group_buy_products ?? []) as Array<{
      product_id: string;
      max_quantity?: number | null;
      sold_count?: number | null;
    }>;
    const line = lines.find((l) => l.product_id === opts.productId);
    if (line?.max_quantity != null) {
      const left = Number(line.max_quantity) - Number(line.sold_count ?? 0);
      if (qty > left) {
        return { ok: false, code: "SOLD_OUT", message: "團購商品已售罄或超過可購數量" };
      }
    }
  }

  return { ok: true, runtimeStatus: runtime, priorQty };
}
