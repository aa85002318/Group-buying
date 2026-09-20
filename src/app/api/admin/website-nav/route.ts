import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_WEBSITE_NAV,
  WEBSITE_NAV_MAX_ITEMS,
  WEBSITE_NAV_SETTING_KEY,
  isValidNavHref,
  normalizeWebsiteNav,
} from "@/lib/site-nav";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ items: DEFAULT_WEBSITE_NAV });
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("value, updated_at")
    .eq("key", WEBSITE_NAV_SETTING_KEY)
    .maybeSingle();
  return NextResponse.json({
    items: data?.value ? normalizeWebsiteNav(data.value) : DEFAULT_WEBSITE_NAV,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "選單資料格式不正確" }, { status: 400 });
  }
  if (body.items.length > WEBSITE_NAV_MAX_ITEMS) {
    return NextResponse.json(
      { error: `頁首選單最多 ${WEBSITE_NAV_MAX_ITEMS} 個，避免手機版擠不下` },
      { status: 400 }
    );
  }
  const items = normalizeWebsiteNav(body.items);
  for (const item of items) {
    for (const link of [item, ...(item.children ?? [])]) {
      if (!isValidNavHref(link.href)) {
        return NextResponse.json(
          { error: `「${link.label}」的連結格式不正確（請用 /路徑 或 https:// 網址）` },
          { status: 400 }
        );
      }
    }
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, items });

  const admin = createAdminClient();
  const { error: upsertError } = await admin.from("site_settings").upsert(
    {
      key: WEBSITE_NAV_SETTING_KEY,
      value: { items },
      updated_by: auth?.profile?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  await logAudit(auth?.profile?.id ?? null, "website_nav.update", "site_settings", WEBSITE_NAV_SETTING_KEY, null, { items });
  return NextResponse.json({ ok: true, items });
}
