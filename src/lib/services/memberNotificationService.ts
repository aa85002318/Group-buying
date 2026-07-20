import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "order"
  | "pickup"
  | "product"
  | "livestream"
  | "system"
  | "group_buy"
  | "campaign"
  | "benefit"
  | "store";

export type CreateNotificationInput = {
  userId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  referenceId?: string | null;
  summary?: string | null;
  campaignId?: string | null;
};

/** Create in-app notification; respects user preferences when possible */
export async function createMemberNotification(
  admin: SupabaseClient,
  input: CreateNotificationInput
): Promise<void> {
  try {
    const prefMap: Partial<Record<NotificationType, keyof NotificationPrefs | null>> = {
      order: "order_updates",
      pickup: "pickup_reminders",
      product: "new_products",
      livestream: "livestreams",
      system: "marketing",
      group_buy: "closing_soon",
      campaign: "marketing",
      benefit: "marketing",
      store: "marketing",
    };

    type NotificationPrefs = {
      order_updates: boolean;
      pickup_reminders: boolean;
      new_products: boolean;
      closing_soon: boolean;
      livestreams: boolean;
      marketing: boolean;
    };

    const prefKey = prefMap[input.notificationType];
    if (prefKey) {
      const { data: prefs } = await admin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", input.userId)
        .maybeSingle();

      if (prefs && prefKey in prefs && !prefs[prefKey as keyof NotificationPrefs]) {
        return;
      }
    }

    await admin.from("notifications").insert({
      user_id: input.userId,
      notification_type: input.notificationType,
      title: input.title,
      summary: input.summary ?? null,
      message: input.message,
      link_url: input.linkUrl ?? null,
      reference_id: input.referenceId ?? null,
      campaign_id: input.campaignId ?? null,
    });
  } catch {
    // Table may not exist yet — graceful degrade
  }
}

export async function notifyOrderCreated(
  admin: SupabaseClient,
  userId: string,
  orderId: string,
  orderNo: string
) {
  await createMemberNotification(admin, {
    userId,
    notificationType: "order",
    title: "訂單建立成功",
    message: `您的訂單 ${orderNo} 已建立，請完成付款。`,
    linkUrl: `/orders/${orderId}`,
    referenceId: orderId,
  });
}

export async function notifyOrderStatusChange(
  admin: SupabaseClient,
  userId: string,
  orderId: string,
  orderNo: string,
  statusLabel: string
) {
  const type = statusLabel.includes("取貨") ? "pickup" : "order";
  await createMemberNotification(admin, {
    userId,
    notificationType: type,
    title: "訂單狀態更新",
    message: `訂單 ${orderNo}：${statusLabel}`,
    linkUrl: `/orders/${orderId}`,
    referenceId: orderId,
  });
}

export async function notifyReadyForPickup(
  admin: SupabaseClient,
  userId: string,
  orderId: string,
  orderNo: string
) {
  await createMemberNotification(admin, {
    userId,
    notificationType: "pickup",
    title: "可以取貨了",
    message: `訂單 ${orderNo} 已可取貨，請至訂單頁出示 QR Code。`,
    linkUrl: `/orders/${orderId}`,
    referenceId: orderId,
  });
}

export async function notifyOrderCompleted(
  admin: SupabaseClient,
  userId: string,
  orderId: string,
  orderNo: string
) {
  await createMemberNotification(admin, {
    userId,
    notificationType: "order",
    title: "訂單已完成",
    message: `訂單 ${orderNo} 已完成，感謝您的購買！`,
    linkUrl: `/orders/${orderId}`,
    referenceId: orderId,
  });
}
