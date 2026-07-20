import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HEADER_PROMO_ITEMS,
  isValidHeaderHref,
  normalizeHeaderPromoItems,
  type HeaderPromoItem,
} from "@/lib/site-header";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ promoItems: DEFAULT_HEADER_PROMO_ITEMS });
  }

  const admin = createAdminClient();
  const { data, error: queryError } = await admin
    .from("site_header_settings")
    .select("promo_items")
    .eq("singleton_key", "main")
    .maybeSingle();

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const promoItems = normalizeHeaderPromoItems(data?.promo_items);
  return NextResponse.json({
    promoItems: Array.isArray(data?.promo_items) ? promoItems : DEFAULT_HEADER_PROMO_ITEMS,
  });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.promoItems)) {
    return NextResponse.json({ error: "快捷資訊格式不正確" }, { status: 400 });
  }

  for (const item of body.promoItems as HeaderPromoItem[]) {
    if (!item?.label?.trim()) {
      return NextResponse.json({ error: "每個快捷資訊都需要顯示文字" }, { status: 400 });
    }
    if (item.href?.trim() && !isValidHeaderHref(item.href)) {
      return NextResponse.json(
        { error: `快捷資訊連結格式不正確：${item.label}` },
        { status: 400 }
      );
    }
  }

  const promoItems = normalizeHeaderPromoItems(body.promoItems);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, promoItems });
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("site_header_settings")
    .update({ promo_items: promoItems, updated_at: new Date().toISOString() })
    .eq("singleton_key", "main");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(
      auth.profile.id,
      "update_header_promos",
      "site_header_settings",
      "main",
      null,
      { promoItems }
    );
  }

  return NextResponse.json({ ok: true, promoItems });
}
