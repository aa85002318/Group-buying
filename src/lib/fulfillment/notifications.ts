import { createAdminClient } from "@/lib/supabase/admin";
import { createMemberNotification } from "@/lib/services/memberNotificationService";
import { sendOrderLineNotification } from "@/lib/line/notifications";
import { sendOrderArrivalEmail, sendOrderCancelledEmail } from "@/lib/email/notifications";
import { FULFILLMENT_STATUS_LABELS, type FulfillmentStatus } from "./status";

function formatDateTw(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-TW");
}

export async function sendFulfillmentNotification(
  orderId: string,
  status: FulfillmentStatus
) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, user_id, order_no, order_number, pickup_deadline_at, pickup_store_id, store_id, customer_email"
    )
    .eq("id", orderId)
    .single();
  if (!order?.user_id) return;

  const storeId = order.pickup_store_id ?? order.store_id;
  const { data: store } = storeId
    ? await admin.from("stores").select("name, address").eq("id", storeId).maybeSingle()
    : { data: null };

  const orderNo = order.order_no ?? order.order_number;
  const storeName = store?.name ?? "指定門市";
  let title = `訂單${FULFILLMENT_STATUS_LABELS[status]}`;
  let message = `您的訂單 ${orderNo} 狀態更新為「${FULFILLMENT_STATUS_LABELS[status]}」。`;
  let type: "order" | "pickup" = "order";

  if (status === "ready_for_pickup") {
    type = "pickup";
    title = "您的 CHIMEIDIY 訂單已備妥！";
    message = [
      `訂單編號：${orderNo}`,
      `取貨門市：${storeName}`,
      `最晚取貨日：${formatDateTw(order.pickup_deadline_at)}`,
      "請於營業時間內出示會員取貨碼完成取貨。",
    ].join("\n");
  } else if (status === "picked_up" || status === "completed") {
    type = "pickup";
    title = "取貨完成";
    message = `訂單 ${orderNo} 已完成取貨，感謝您的購買。`;
  } else if (status === "paid") {
    title = "付款成功";
    message = `訂單 ${orderNo} 已付款成功，門市將開始備貨。`;
  } else if (status === "preparing") {
    title = "開始備貨";
    message = `訂單 ${orderNo} 已開始備貨。`;
  } else if (status === "pickup_expired") {
    type = "pickup";
    title = "逾期未取";
    message = `訂單 ${orderNo} 已超過取貨期限，請聯絡客服或門市處理。`;
  } else if (status === "cancelled") {
    title = "訂單已取消";
    message = `訂單 ${orderNo} 已取消。`;
  } else if (status === "refunded" || status === "refund_pending") {
    title = status === "refunded" ? "退款完成" : "退款處理中";
    message = `訂單 ${orderNo} ${title}。`;
  }

  await createMemberNotification(admin, {
    userId: order.user_id,
    notificationType: type,
    title,
    message,
    linkUrl: `/member/orders/${orderId}`,
    referenceId: orderId,
  });

  await admin.from("notification_logs").insert({
    order_id: orderId,
    user_id: order.user_id,
    event_key: status,
    channel: "app",
    status: "sent",
    payload: { title, message },
  });

  const lineEvent =
    status === "ready_for_pickup"
      ? "arrival"
      : status === "cancelled"
        ? "cancelled"
        : status === "paid"
          ? "payment_confirmed"
          : null;
  if (lineEvent) {
    const line = await sendOrderLineNotification(orderId, lineEvent).catch((e) => {
      console.warn("[fulfillment] line failed", e);
      return { ok: false as const };
    });
    await admin.from("notification_logs").insert({
      order_id: orderId,
      user_id: order.user_id,
      event_key: status,
      channel: "line",
      status: line && "ok" in line && line.ok === false ? "failed" : "sent",
    });
  }

  if (status === "ready_for_pickup") {
    const mail = await sendOrderArrivalEmail(orderId).catch(() => ({ ok: false }));
    await admin.from("notification_logs").insert({
      order_id: orderId,
      user_id: order.user_id,
      event_key: status,
      channel: "email",
      status: mail && "ok" in mail && mail.ok === false ? "failed" : "sent",
    });
  }
  if (status === "cancelled") {
    await sendOrderCancelledEmail(orderId).catch(() => null);
  }
}

export async function sendPickupReminder(orderId: string, dueToday: boolean) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, order_no, order_number, pickup_deadline_at")
    .eq("id", orderId)
    .single();
  if (!order?.user_id) return;

  const orderNo = order.order_no ?? order.order_number;
  const title = dueToday ? "今日為最晚取貨日" : "取貨期限即將到期";
  const message = `訂單 ${orderNo} ${title}（${formatDateTw(order.pickup_deadline_at)}），請盡快至門市取貨。`;

  await createMemberNotification(admin, {
    userId: order.user_id,
    notificationType: "pickup",
    title,
    message,
    linkUrl: `/member/orders/${orderId}`,
    referenceId: orderId,
  });

  await admin.from("notification_logs").insert({
    order_id: orderId,
    user_id: order.user_id,
    event_key: dueToday ? "pickup_due_today" : "pickup_remind",
    channel: "app",
    status: "sent",
    payload: { title, message },
  });
}
