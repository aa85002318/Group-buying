import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRIORITY_RANK,
  validatePopupLink,
  computeDisplayStatus,
  clickRate,
  type HomepagePopup,
  type HomepagePopupPriority,
  type HomepagePopupStatus,
} from "@/lib/popups/types";

function normalizeBody(body: Record<string, unknown>) {
  const priority = (body.priority as HomepagePopupPriority) || "normal";
  const linkType = String(body.link_type ?? "internal") as HomepagePopup["link_type"];
  const linkUrl = body.link_url != null ? String(body.link_url).trim() : null;
  const linkCheck = validatePopupLink(linkType, linkUrl);
  if (!linkCheck.ok && body.status !== "draft") {
    return { error: linkCheck.error };
  }

  return {
    data: {
      internal_name: String(body.internal_name ?? "").trim(),
      title: String(body.title ?? "").trim(),
      description: body.description != null ? String(body.description).trim() || null : null,
      desktop_image_url: body.desktop_image_url ? String(body.desktop_image_url).trim() : null,
      mobile_image_url: body.mobile_image_url ? String(body.mobile_image_url).trim() : null,
      button_text: String(body.button_text ?? "立即查看").trim() || "立即查看",
      link_type: linkType,
      link_url: linkCheck.ok ? linkCheck.url : linkUrl,
      linked_resource_id: body.linked_resource_id
        ? String(body.linked_resource_id).trim()
        : null,
      display_scope: String(body.display_scope ?? "home_only"),
      audience_type: String(body.audience_type ?? "all"),
      priority,
      priority_rank: PRIORITY_RANK[priority] ?? 50,
      allow_close: body.allow_close !== false,
      allow_close_on_backdrop: body.allow_close_on_backdrop !== false,
      allow_dismiss_today: body.allow_dismiss_today !== false,
      dismiss_after_click: body.dismiss_after_click !== false,
      starts_at: body.starts_at ? String(body.starts_at) : null,
      ends_at: body.ends_at ? String(body.ends_at) : null,
      status: String(body.status ?? "draft") as HomepagePopupStatus,
    },
  };
}

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ popups: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("homepage_popups")
    .select("*")
    .order("priority_rank", { ascending: false })
    .order("starts_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const popups = (data as HomepagePopup[] | null)?.map((p) => ({
    ...p,
    display_status: computeDisplayStatus(p),
    click_rate: clickRate(p.view_count ?? 0, p.click_count ?? 0),
  }));

  return NextResponse.json({ popups: popups ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const normalized = normalizeBody(body);
  if ("error" in normalized && normalized.error) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }
  const row = normalized.data!;
  if (!row.internal_name) {
    return NextResponse.json({ error: "請填寫公告名稱（後台辨識用）" }, { status: 400 });
  }
  if (!row.mobile_image_url && !row.desktop_image_url) {
    return NextResponse.json({ error: "請至少上傳手機或桌機圖片" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      popup: { id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() },
    });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("homepage_popups")
    .insert({
      ...row,
      created_by: auth!.profile.id,
      updated_by: auth!.profile.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await logAudit(auth!.profile.id, "create_homepage_popup", "homepage_popup", data.id, null, {
    internal_name: row.internal_name,
    status: row.status,
  });

  return NextResponse.json({ popup: data });
}
