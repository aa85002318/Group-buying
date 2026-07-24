import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRIORITY_RANK,
  validatePopupLink,
  type HomepagePopup,
  type HomepagePopupPriority,
  type HomepagePopupStatus,
} from "@/lib/popups/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("homepage_popups")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "找不到公告" }, { status: 404 });
  }

  const { data: events } = await admin
    .from("homepage_popup_events")
    .select("id, event_type, occurred_at, user_id, session_id")
    .eq("popup_id", id)
    .order("occurred_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ popup: data, events: events ?? [] });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("homepage_popups").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "找不到公告" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_by: auth!.profile.id };

  const stringFields = [
    "internal_name",
    "title",
    "description",
    "desktop_image_url",
    "mobile_image_url",
    "button_text",
    "link_type",
    "link_url",
    "linked_resource_id",
    "display_scope",
    "audience_type",
    "priority",
    "starts_at",
    "ends_at",
    "status",
  ] as const;

  for (const key of stringFields) {
    if (body[key] !== undefined) {
      const v = body[key];
      updates[key] = v === "" || v === null ? null : v;
    }
  }

  const boolFields = [
    "allow_close",
    "allow_close_on_backdrop",
    "allow_dismiss_today",
    "dismiss_after_click",
  ] as const;
  for (const key of boolFields) {
    if (body[key] !== undefined) updates[key] = Boolean(body[key]);
  }

  if (updates.priority) {
    updates.priority_rank =
      PRIORITY_RANK[updates.priority as HomepagePopupPriority] ?? 50;
  }

  if (updates.internal_name != null && !String(updates.internal_name).trim()) {
    return NextResponse.json({ error: "公告名稱不可空白" }, { status: 400 });
  }

  const nextLinkType = (updates.link_type as HomepagePopup["link_type"]) ?? old.link_type;
  const nextLinkUrl =
    updates.link_url !== undefined ? (updates.link_url as string | null) : old.link_url;
  const nextStatus = (updates.status as HomepagePopupStatus) ?? old.status;
  if (nextStatus !== "draft") {
    const check = validatePopupLink(nextLinkType, nextLinkUrl);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    updates.link_url = check.url;
  }

  const { data, error: updateError } = await admin
    .from("homepage_popups")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAudit(auth!.profile.id, "update_homepage_popup", "homepage_popup", id, {
    status: old.status,
    internal_name: old.internal_name,
  }, {
    status: data.status,
    internal_name: data.internal_name,
  });

  return NextResponse.json({ popup: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("homepage_popups")
    .select("id, internal_name")
    .eq("id", id)
    .single();

  const { error: delError } = await admin.from("homepage_popups").delete().eq("id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete_homepage_popup", "homepage_popup", id, old, null);
  return NextResponse.json({ ok: true });
}
