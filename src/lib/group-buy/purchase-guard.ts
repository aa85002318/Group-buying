import { computeGroupBuyRuntimeStatus } from "@/lib/group-buy/page-settings";
import { getGroupBuyPageSettings } from "@/lib/group-buy/settings-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export type GroupBuyPurchaseCheck =
  | { ok: true; runtimeStatus: string }
  | { ok: false; code: string; message: string };

/**
 * Server-side gate for group-buy purchases.
 * Call from createOrder when groupBuyEventId is present.
 */
export async function assertGroupBuyPurchasable(
  eventId: string,
  opts?: { productId?: string; quantity?: number; userId?: string }
): Promise<GroupBuyPurchaseCheck> {
  if (!isSupabaseConfigured()) {
    return { ok: true, runtimeStatus: "active" };
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
  if (event.max_qty_per_user != null && qty > Number(event.max_qty_per_user)) {
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

  return { ok: true, runtimeStatus: runtime };
}
