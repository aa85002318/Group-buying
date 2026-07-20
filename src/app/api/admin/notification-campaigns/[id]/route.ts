import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeLinkUrl, stripHtmlToText } from "@/lib/cms/safeHtml";
import { sendNotificationCampaign } from "@/lib/services/notificationCampaignService";
import type { NotificationCampaign } from "@/lib/types/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ campaign: null });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("notification_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "找不到通知" }, { status: 404 });
  return NextResponse.json({ campaign: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("notification_campaigns").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "找不到通知" }, { status: 404 });

  if (body.action === "cancel") {
    if (old.status !== "scheduled" && old.status !== "draft") {
      return NextResponse.json({ error: "僅能取消草稿或預約中的通知" }, { status: 400 });
    }
    const { data, error: upErr } = await admin
      .from("notification_campaigns")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    await logAudit(auth!.profile.id, "update", "notification_campaign", id, old, data, request as never);
    return NextResponse.json({ campaign: data });
  }

  if (body.action === "send_now") {
    if (old.status === "sent") {
      return NextResponse.json({ error: "此通知已發送" }, { status: 400 });
    }
    await admin.from("notification_campaigns").update({ status: "sending" }).eq("id", id);
    const result = await sendNotificationCampaign(admin, { ...old, status: "sending" } as NotificationCampaign);
    await logAudit(auth!.profile.id, "update", "notification_campaign", id, old, { sent: result.sent }, request as never);
    return NextResponse.json({ ok: true, sent: result.sent });
  }

  if (old.status === "sent") {
    return NextResponse.json({ error: "已發送的通知不可編輯" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = stripHtmlToText(body.title);
  if (body.summary !== undefined) updates.summary = body.summary ? stripHtmlToText(body.summary) : null;
  if (body.body !== undefined) updates.body = stripHtmlToText(body.body);
  if (body.category !== undefined) updates.category = body.category;
  if (body.link_url !== undefined) {
    if (body.link_url && !isSafeLinkUrl(body.link_url)) {
      return NextResponse.json({ error: "連結不合法" }, { status: 400 });
    }
    updates.link_url = body.link_url || null;
  }
  if (body.audience_type !== undefined) updates.audience_type = body.audience_type;
  if (body.audience_filter !== undefined) updates.audience_filter = body.audience_filter;
  if (body.scheduled_at !== undefined) {
    updates.scheduled_at = body.scheduled_at ? new Date(body.scheduled_at).toISOString() : null;
    if (body.scheduled_at) updates.status = "scheduled";
  }
  if (body.status !== undefined) updates.status = body.status;

  const { data, error: upErr } = await admin
    .from("notification_campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update", "notification_campaign", id, old, data, request as never);
  return NextResponse.json({ campaign: data });
}
