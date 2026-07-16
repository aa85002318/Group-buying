import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import {
  DEFAULT_HEADER_NAV_ITEMS,
  isValidHeaderHref,
  normalizeHeaderNavItems,
  type HeaderNavItem,
} from "@/lib/site-header";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      brandTitle: BRAND_NAME,
      brandSubtitle: BRAND_SUBTITLE,
      navItems: DEFAULT_HEADER_NAV_ITEMS,
    });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("site_header_settings")
    .select("brand_title,brand_subtitle,nav_items")
    .eq("singleton_key", "main")
    .maybeSingle();

  const navItems = normalizeHeaderNavItems(data?.nav_items);
  return NextResponse.json({
    brandTitle: data?.brand_title ?? BRAND_NAME,
    brandSubtitle: data?.brand_subtitle ?? BRAND_SUBTITLE,
    navItems: navItems.length > 0 ? navItems : DEFAULT_HEADER_NAV_ITEMS,
  });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));

  const brandTitle = typeof body.brandTitle === "string" ? body.brandTitle.trim() : "";
  const brandSubtitle = typeof body.brandSubtitle === "string" ? body.brandSubtitle.trim() : "";
  const navItems = normalizeHeaderNavItems(body.navItems);

  if (!brandTitle || !brandSubtitle) {
    return NextResponse.json({ error: "請填寫品牌主標與副標" }, { status: 400 });
  }

  if (!Array.isArray(body.navItems)) {
    return NextResponse.json({ error: "navItems 格式不正確" }, { status: 400 });
  }

  for (const item of body.navItems as HeaderNavItem[]) {
    if (!item?.label?.trim()) {
      return NextResponse.json({ error: "每個項目都需要名稱" }, { status: 400 });
    }
    if (!isValidHeaderHref(String(item.href ?? ""))) {
      return NextResponse.json(
        { error: `連結格式不正確：${item.label}（請使用 /路徑 或 https:// 網址）` },
        { status: 400 }
      );
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, navItems });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error: upsertError } = await admin
    .from("site_header_settings")
    .upsert(
      {
        singleton_key: "main",
        brand_title: brandTitle,
        brand_subtitle: brandSubtitle,
        nav_items: navItems,
        updated_at: now,
      },
      { onConflict: "singleton_key" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "update_site_header", "site_header_settings", "main", null, {
      brandTitle,
      brandSubtitle,
      navItems,
    });
  }

  return NextResponse.json({
    ok: true,
    brandTitle,
    brandSubtitle,
    navItems,
    settings: data,
  });
}
