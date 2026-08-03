import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_INFO_BANNERS,
  mapCmsToInfoBanner,
  placementForSlot,
  SHOP_CORPORATE_PLACEMENT,
  SHOP_ORDER_GUIDE_PLACEMENT,
  type ShopInfoBannerSlot,
} from "@/lib/shop/info-banners";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/info-banners */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      order_guide: DEFAULT_SHOP_INFO_BANNERS.order_guide,
      corporate: DEFAULT_SHOP_INFO_BANNERS.corporate,
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cms_banners")
    .select("*")
    .in("placement", [SHOP_ORDER_GUIDE_PLACEMENT, SHOP_CORPORATE_PLACEMENT]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = {
    order_guide: DEFAULT_SHOP_INFO_BANNERS.order_guide,
    corporate: DEFAULT_SHOP_INFO_BANNERS.corporate,
  };

  for (const row of data ?? []) {
    const placement = String(row.placement ?? "");
    if (placement === SHOP_ORDER_GUIDE_PLACEMENT) {
      result.order_guide = mapCmsToInfoBanner(row as Record<string, unknown>, "order_guide");
    }
    if (placement === SHOP_CORPORATE_PLACEMENT) {
      result.corporate = mapCmsToInfoBanner(row as Record<string, unknown>, "corporate");
    }
  }

  return NextResponse.json(result);
}

/** PATCH /api/admin/shop/info-banners — upsert one slot */
export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const slot = String(body.slot ?? "") as ShopInfoBannerSlot;
  if (slot !== "order_guide" && slot !== "corporate") {
    return NextResponse.json({ error: "無效的 banner 類型" }, { status: 400 });
  }

  const placement = placementForSlot(slot);
  const imageUrl = String(body.image_url ?? "").trim();
  if (!imageUrl) {
    return NextResponse.json({ error: "請上傳圖片" }, { status: 400 });
  }

  const payload = {
    title: String(body.title ?? DEFAULT_SHOP_INFO_BANNERS[slot].title).trim(),
    subtitle: String(body.subtitle ?? "").trim() || null,
    image_url: imageUrl,
    mobile_image_url: String(body.mobile_image_url ?? imageUrl).trim() || imageUrl,
    link_url: String(body.link_url ?? "/").trim() || "/",
    link_type: String(body.link_type ?? "page").trim() || "page",
    button_text: String(body.button_text ?? "").trim() || null,
    alt_text: String(body.alt_text ?? body.title ?? "").trim() || null,
    placement,
    banner_type: placement,
    is_active: body.is_active !== false,
    status: body.is_active === false ? "inactive" : "active",
    sort_order: slot === "order_guide" ? 10 : 20,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      banner: mapCmsToInfoBanner({ id: `mock-${slot}`, ...payload }, slot),
    });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("cms_banners")
    .select("id")
    .eq("placement", placement)
    .maybeSingle();

  let data;
  let old = null;
  if (existing?.id) {
    const { data: prev } = await admin
      .from("cms_banners")
      .select("*")
      .eq("id", existing.id)
      .single();
    old = prev;
    const { data: updated, error } = await admin
      .from("cms_banners")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    data = updated;
  } else {
    const { data: inserted, error } = await admin
      .from("cms_banners")
      .insert(payload)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    data = inserted;
  }

  await logAudit(
    auth!.profile.id,
    existing?.id ? "update" : "create",
    "shop_info_banner",
    String(data.id),
    old,
    data,
    request as never
  );

  return NextResponse.json({
    banner: mapCmsToInfoBanner(data as Record<string, unknown>, slot),
  });
}
