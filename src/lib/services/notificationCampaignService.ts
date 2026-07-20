import type { SupabaseClient } from "@supabase/supabase-js";
import { isSafeLinkUrl, stripHtmlToText } from "@/lib/cms/safeHtml";
import type {
  MemberNotificationCategory,
  NotificationCampaign,
  NotificationAudienceType,
} from "@/lib/types/database";
import { createMemberNotification } from "@/lib/services/memberNotificationService";

export const MEMBER_NOTIFICATION_CATEGORIES: Array<{
  value: MemberNotificationCategory;
  label: string;
}> = [
  { value: "order", label: "訂單" },
  { value: "group_buy", label: "團購" },
  { value: "campaign", label: "活動" },
  { value: "benefit", label: "福利" },
  { value: "store", label: "門市公告" },
  { value: "system", label: "系統" },
];

/** Map UI filter tabs → DB notification_type values (incl. legacy). */
export function categoryFilterTypes(tab: string): string[] | null {
  if (!tab || tab === "all") return null;
  if (tab === "order") return ["order", "pickup"];
  if (tab === "campaign") return ["campaign", "product", "livestream"];
  return [tab];
}

async function resolveAudienceUserIds(
  admin: SupabaseClient,
  audienceType: NotificationAudienceType,
  filter: Record<string, unknown>
): Promise<string[]> {
  if (audienceType === "users") {
    const raw = filter.user_ids;
    const list = Array.isArray(raw)
      ? raw.map(String)
      : String(raw ?? "")
          .split(/[\s,]+/)
          .filter(Boolean);
    return Array.from(new Set(list));
  }

  if (audienceType === "order_status") {
    const status = String(filter.order_status ?? "").trim();
    if (!status) return [];
    const { data } = await admin.from("orders").select("user_id").eq("status", status);
    return Array.from(
      new Set((data ?? []).map((o) => o.user_id).filter(Boolean) as string[])
    );
  }

  // all App members
  const { data } = await admin.from("profiles").select("id").eq("role", "member");
  if (data?.length) return data.map((p) => p.id);
  const { data: all } = await admin.from("profiles").select("id, role");
  return (all ?? [])
    .filter((p) => p.role !== "admin" && p.role !== "store_staff")
    .map((p) => p.id);
}

export async function sendNotificationCampaign(
  admin: SupabaseClient,
  campaign: NotificationCampaign
): Promise<{ sent: number }> {
  const userIds = await resolveAudienceUserIds(
    admin,
    campaign.audience_type,
    campaign.audience_filter ?? {}
  );

  const title = stripHtmlToText(campaign.title);
  const message = stripHtmlToText(campaign.body);
  const summary = campaign.summary ? stripHtmlToText(campaign.summary) : null;
  const linkUrl =
    campaign.link_url && isSafeLinkUrl(campaign.link_url) ? campaign.link_url : null;

  let sent = 0;
  // Batch insert for performance
  const rows = userIds.map((userId) => ({
    user_id: userId,
    notification_type: campaign.category,
    title,
    summary,
    message: summary ? `${summary}\n${message}` : message,
    link_url: linkUrl,
    reference_id: campaign.target_id,
    campaign_id: campaign.id,
  }));

  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await admin.from("notifications").insert(chunk);
    if (error) {
      // Fallback without new columns
      for (const row of chunk) {
        await createMemberNotification(admin, {
          userId: row.user_id,
          notificationType: row.notification_type as never,
          title: row.title,
          message: row.message,
          linkUrl: row.link_url,
          referenceId: row.reference_id,
        });
        sent += 1;
      }
    } else {
      sent += chunk.length;
    }
  }

  await admin
    .from("notification_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_count: sent,
    })
    .eq("id", campaign.id);

  return { sent };
}

export async function processDueNotificationCampaigns(admin: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await admin
    .from("notification_campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(20);

  let processed = 0;
  for (const c of data ?? []) {
    await admin.from("notification_campaigns").update({ status: "sending" }).eq("id", c.id);
    await sendNotificationCampaign(admin, c as NotificationCampaign);
    processed += 1;
  }
  return processed;
}
