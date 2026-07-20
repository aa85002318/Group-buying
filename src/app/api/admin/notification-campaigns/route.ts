import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeLinkUrl, stripHtmlToText } from "@/lib/cms/safeHtml";
import {
  processDueNotificationCampaigns,
  sendNotificationCampaign,
} from "@/lib/services/notificationCampaignService";
import type { NotificationCampaign } from "@/lib/types/database";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaigns: [] });
  }

  const admin = createAdminClient();
  // Opportunistically send due scheduled campaigns
  try {
    await processDueNotificationCampaigns(admin);
  } catch {
    /* ignore */
  }

  const { data, error: fetchError } = await admin
    .from("notification_campaigns")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (fetchError) {
    if (fetchError.code === "42P01") return NextResponse.json({ campaigns: [] });
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const title = stripHtmlToText(body.title);
  const campaignBody = stripHtmlToText(body.body ?? body.message);
  if (!title || !campaignBody) {
    return NextResponse.json({ error: "請填寫標題與內容" }, { status: 400 });
  }
  if (body.link_url && !isSafeLinkUrl(body.link_url)) {
    return NextResponse.json({ error: "連結不合法" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaign: { id: "mock", title } }, { status: 201 });
  }

  const admin = createAdminClient();
  const action = body.action as "draft" | "schedule" | "send_now" | undefined;
  let status: NotificationCampaign["status"] = "draft";
  let scheduledAt: string | null = null;

  if (action === "schedule") {
    if (!body.scheduled_at) {
      return NextResponse.json({ error: "請設定預約時間" }, { status: 400 });
    }
    status = "scheduled";
    scheduledAt = new Date(body.scheduled_at).toISOString();
  } else if (action === "send_now") {
    status = "sending";
  }

  const audienceType = body.audience_type ?? (body.user_id ? "users" : "all");
  const audienceFilter =
    body.audience_filter ??
    (body.user_id
      ? { user_ids: [body.user_id] }
      : body.user_ids_text
        ? { user_ids: String(body.user_ids_text).split(/[\s,]+/).filter(Boolean) }
        : body.order_status
          ? { order_status: body.order_status }
          : {});

  const payload = {
    title,
    summary: body.summary ? stripHtmlToText(body.summary) : null,
    body: campaignBody,
    category: body.category ?? body.notification_type ?? "system",
    target_type: body.target_type ?? null,
    target_id: body.target_id ?? null,
    link_url: body.link_url?.trim() || null,
    audience_type: audienceType,
    audience_filter: audienceFilter,
    status,
    scheduled_at: scheduledAt,
    created_by: auth!.profile.id,
  };

  const { data, error: insertError } = await admin
    .from("notification_campaigns")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  let sent = 0;
  if (action === "send_now") {
    const result = await sendNotificationCampaign(admin, data as NotificationCampaign);
    sent = result.sent;
  }

  await logAudit(auth!.profile.id, "create", "notification_campaign", data.id, null, {
    ...data,
    sent,
  }, request as never);

  return NextResponse.json({ campaign: data, sent }, { status: 201 });
}
