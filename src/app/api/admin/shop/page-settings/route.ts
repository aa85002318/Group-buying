import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  normalizeShopHex,
  parseShopPageSettings,
} from "@/lib/shop/page-settings";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/page-settings */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_SHOP_PAGE_SETTINGS });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_page_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    settings: parseShopPageSettings((data as Record<string, unknown>) ?? undefined),
  });
}

/** PATCH /api/admin/shop/page-settings */
export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const header = normalizeShopHex(
    body.header_bg_color,
    DEFAULT_SHOP_PAGE_SETTINGS.header_bg_color
  );
  const hero = normalizeShopHex(
    body.hero_bg_color ?? body.header_bg_color,
    DEFAULT_SHOP_PAGE_SETTINGS.hero_bg_color
  );

  let border: string | null = null;
  if (body.header_border_color != null && String(body.header_border_color).trim()) {
    border = normalizeShopHex(body.header_border_color, "");
    if (!border) {
      return NextResponse.json({ error: "分隔線顏色須為 #RRGGBB" }, { status: 400 });
    }
  }

  const payload = {
    singleton_key: "main",
    header_bg_color: header,
    hero_bg_color: hero,
    header_border_color: border,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: parseShopPageSettings(payload) });
  }

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("shop_page_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();

  const { data, error } = await admin
    .from("shop_page_settings")
    .upsert(payload, { onConflict: "singleton_key" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "update",
    "shop_page_settings",
    "main",
    old,
    data,
    request as never
  );

  return NextResponse.json({
    settings: parseShopPageSettings(data as Record<string, unknown>),
  });
}
