import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SIDE_MENU_SECTIONS,
  isValidHeaderHref,
  normalizeSideMenuSections,
  type SideMenuSection,
} from "@/lib/site-header";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sections: DEFAULT_SIDE_MENU_SECTIONS });
  }

  const admin = createAdminClient();
  const { data, error: queryError } = await admin
    .from("site_header_settings")
    .select("side_menu_sections")
    .eq("singleton_key", "main")
    .maybeSingle();

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const sections = normalizeSideMenuSections(data?.side_menu_sections);
  return NextResponse.json({
    sections: sections.length > 0 ? sections : DEFAULT_SIDE_MENU_SECTIONS,
  });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.sections)) {
    return NextResponse.json({ error: "側邊選單格式不正確" }, { status: 400 });
  }

  for (const section of body.sections as SideMenuSection[]) {
    if (!section?.title?.trim()) {
      return NextResponse.json({ error: "每個選單區塊都需要標題" }, { status: 400 });
    }
    if (!Array.isArray(section.items) || section.items.length === 0) {
      return NextResponse.json(
        { error: `「${section.title}」至少需要一個項目` },
        { status: 400 }
      );
    }
    for (const item of section.items) {
      if (!item.label?.trim()) {
        return NextResponse.json({ error: "每個選單項目都需要名稱" }, { status: 400 });
      }
      if (!isValidHeaderHref(item.href ?? "")) {
        return NextResponse.json(
          { error: `選單連結格式不正確：${item.label}` },
          { status: 400 }
        );
      }
    }
  }

  const sections = normalizeSideMenuSections(body.sections);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, sections });
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("site_header_settings")
    .update({ side_menu_sections: sections, updated_at: new Date().toISOString() })
    .eq("singleton_key", "main");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(
      auth.profile.id,
      "update_side_menu",
      "site_header_settings",
      "main",
      null,
      { sections }
    );
  }

  return NextResponse.json({ ok: true, sections });
}
