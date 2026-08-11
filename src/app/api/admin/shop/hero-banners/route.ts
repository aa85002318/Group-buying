import { NextResponse } from "next/server";
import { canonicalizeAppHref } from "@/lib/site-links";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  mapCmsRowToShopHero,
  SHOP_HERO_BANNER_TYPE,
} from "@/types/shop-hero-banner";

export const dynamic = "force-dynamic";

function toPayload(body: Record<string, unknown>) {
  const desktop = String(body.desktop_image_url ?? body.desktop_image ?? body.image_url ?? "").trim();
  const mobile = String(body.mobile_image_url ?? body.mobile_image ?? "").trim();
  const linkTargetRaw = String(body.link_target ?? "_self").trim();
  return {
    title: String(body.title ?? "").trim(),
    alt_text: String(body.alt_text ?? body.title ?? "").trim(),
    subtitle: body.subtitle ? String(body.subtitle).trim() : null,
    image_url: desktop || null,
    mobile_image_url: mobile || null,
    link_url: (() => {
      const raw = body.link_url != null ? String(body.link_url).trim() : body.link != null ? String(body.link).trim() : "";
      return raw ? canonicalizeAppHref(raw) : null;
    })(),
    link_target: linkTargetRaw === "_blank" ? "_blank" : "_self",
    button_text: body.button_text ? String(body.button_text).trim() : null,
    placement: SHOP_HERO_BANNER_TYPE,
    banner_type: SHOP_HERO_BANNER_TYPE,
    sort_order: Number(body.sort_order ?? 0) || 0,
    is_active: body.is_active !== false,
    status: body.is_active === false ? "inactive" : "active",
    starts_at: body.starts_at ? String(body.starts_at) : null,
    ends_at: body.ends_at ? String(body.ends_at) : null,
  };
}

/** GET /api/admin/shop/hero-banners */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ banners: DEFAULT_SHOP_HERO_BANNERS });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cms_banners")
    .select("*")
    .or(`placement.eq.${SHOP_HERO_BANNER_TYPE},banner_type.eq.${SHOP_HERO_BANNER_TYPE}`)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    banners: (data ?? [])
      .map((r) => mapCmsRowToShopHero(r as Record<string, unknown>))
      .filter(Boolean),
    raw: data ?? [],
  });
}

/** POST /api/admin/shop/hero-banners */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = (await request.json()) as Record<string, unknown>;
  const payload = toPayload(body);
  if (!payload.title) {
    return NextResponse.json({ error: "標題必填" }, { status: 400 });
  }
  if (!payload.image_url) {
    return NextResponse.json({ error: "桌面圖片必填" }, { status: 400 });
  }

  if (payload.link_url) {
    const { isSafeLinkUrl } = await import("@/lib/cms/safeHtml");
    if (!isSafeLinkUrl(payload.link_url)) {
      return NextResponse.json({ error: "連結不合法" }, { status: 400 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { banner: { id: `mock-${Date.now()}`, ...payload } },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cms_banners")
    .insert({
      ...payload,
      created_by: auth!.profile.id,
      updated_by: auth!.profile.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "cms_banner", data.id, null, data, request as never);
  return NextResponse.json(
    { banner: mapCmsRowToShopHero(data as Record<string, unknown>) },
    { status: 201 }
  );
}
