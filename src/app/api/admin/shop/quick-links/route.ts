import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_QUICK_LINKS,
  parseShopQuickLink,
  parseShopQuickLinks,
} from "@/lib/shop/quick-links";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/quick-links */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ links: DEFAULT_SHOP_QUICK_LINKS });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_quick_links")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({
      links: DEFAULT_SHOP_QUICK_LINKS,
    });
  }
  return NextResponse.json({ links: parseShopQuickLinks(data ?? []) });
}

/** POST /api/admin/shop/quick-links */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const parsed = parseShopQuickLink(body as Record<string, unknown>);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ link: { ...parsed, id: `mock-${Date.now()}` } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_quick_links")
    .insert({
      title: parsed.title,
      subtitle: parsed.subtitle,
      icon_type: parsed.icon_type,
      icon_key: parsed.icon_key,
      icon_image_url: parsed.icon_image_url,
      icon_image_path: parsed.icon_image_path,
      background_color: parsed.background_color,
      text_color: parsed.text_color,
      badge_text: parsed.badge_text,
      badge_color: parsed.badge_color,
      target_type: parsed.target_type,
      target_url: parsed.target_url,
      sort_order: parsed.sort_order,
      is_active: parsed.is_active,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "shop_quick_links", data.id, null, data, request as never);
  return NextResponse.json({ link: parseShopQuickLink(data as Record<string, unknown>) }, { status: 201 });
}
