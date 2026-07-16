import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import { pushLineText } from "@/lib/line/messaging";

export type OrderLineEventType = "confirmation" | "unpaid" | "cancelled" | "arrival" | "payment_confirmed";

type OrderLineContext = {
  orderId: string;
  orderNo: string;
  totalAmount: number;
  storeName?: string | null;
  storeAddress?: string | null;
};

function buildOrderLineText(
  event: OrderLineEventType,
  ctx: OrderLineContext,
  opts?: { reason?: string }
): string {
  const siteUrl = getSiteUrl();
  const orderUrl = `${siteUrl}/orders/${ctx.orderId}`;

  const base = [
    `棋美團購 通知`,
    `訂單：${ctx.orderNo}`,
    `金額：${formatCurrency(ctx.totalAmount)}`,
  ];

  if (event === "confirmation") {
    return [...base, `狀態：已建立訂單`, `查看：${orderUrl}`].join("\n");
  }

  if (event === "payment_confirmed") {
    const store = ctx.storeName ? `取貨門市：${ctx.storeName}` : null;
    return [
      ...base,
      "狀態：已付款確認",
      store ?? "",
      ctx.storeAddress ? `地址：${ctx.storeAddress}` : "",
      `查看：${orderUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (event === "arrival") {
    return [
      ...base,
      "狀態：到貨/待取貨",
      ctx.storeName ? `取貨門市：${ctx.storeName}` : "",
      ctx.storeAddress ? `地址：${ctx.storeAddress}` : "",
      `查看：${orderUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (event === "unpaid") {
    return [...base, "狀態：尚未付款", `查看：${orderUrl}`].join("\n");
  }

  if (event === "cancelled") {
    const reason = opts?.reason?.trim() ? `原因：${opts?.reason}` : "";
    return [...base, "狀態：已取消", reason, `查看：${orderUrl}`].filter(Boolean).join("\n");
  }

  return [...base, `查看：${orderUrl}`].join("\n");
}

async function loadOrderForLine(orderId: string): Promise<{
  id: string;
  orderNo: string;
  totalAmount: number;
  userId: string;
  pickupStoreId: string | null;
  storeId: string | null;
} | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("id, order_no, order_number, total_amount, user_id, pickup_store_id, store_id")
    .eq("id", orderId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    orderNo: String(data.order_no ?? data.order_number ?? data.id.slice(0, 8)),
    totalAmount: Number(data.total_amount ?? 0),
    userId: data.user_id,
    pickupStoreId: data.pickup_store_id ?? null,
    storeId: data.store_id ?? null,
  };
}

async function loadStoreInfo(storeId: string | null): Promise<{ name?: string | null; address?: string | null } | null> {
  if (!storeId) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stores")
    .select("name, address")
    .eq("id", storeId)
    .maybeSingle();

  if (error) return null;
  return data;
}

async function resolveLineUserId(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  const { data, error } = await admin
    .from("line_bindings")
    .select("line_user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.line_user_id) return null;
  return String(data.line_user_id);
}

export async function sendOrderLineNotification(
  orderId: string,
  event: OrderLineEventType,
  opts?: { reason?: string }
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const order = await loadOrderForLine(orderId);
    if (!order) return { ok: false, error: "訂單不存在或無法讀取" };

    const lineUserId = await resolveLineUserId(admin, order.userId);
    if (!lineUserId) return { ok: true, skipped: true };

    const store = await loadStoreInfo(order.pickupStoreId ?? order.storeId);

    const ctx: OrderLineContext = {
      orderId: order.id,
      orderNo: order.orderNo,
      totalAmount: order.totalAmount,
      storeName: store?.name ?? null,
      storeAddress: store?.address ?? null,
    };

    const text = buildOrderLineText(event, ctx, opts);
    const res = await pushLineText(lineUserId, text);
    if (!res.ok) return { ok: false, error: res.error };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "LINE 發送失敗" };
  }
}

