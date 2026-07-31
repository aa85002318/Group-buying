import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  mapCmsRowToShopHero,
  SHOP_HERO_BANNER_TYPE,
} from "@/types/shop-hero-banner";

export const dynamic = "force-dynamic";

function toCmsPayload(body: Record<string, unknown>) {
  const type = String(body.type ?? SHOP_HERO_BANNER_TYPE).trim() || SHOP_HERO_BANNER_TYPE;
  const desktop = String(body.desktop_image ?? body.image_url ?? "").trim();
  const mobile = String(body.mobile_image ?? body.mobile_image_url ?? "").trim();
  return {
    title: String(body.title ?? "").trim(),
    subtitle: body.subtitle ? String(body.subtitle).trim() : null,
    image_url: desktop || null,
    mobile_image_url: mobile || null,
    link_url: body.link ? String(body.link).trim() : body.link_url ? String(body.link_url).trim() : null,
    button_text: body.button_text ? String(body.button_text).trim() : null,
    placement: type,
    banner_type: type,
    sort_order: Number(body.sort_order ?? 0) || 0,
    is_active: body.is_active !== false,
    status: body.is_active === false ? "inactive" : "active",
  };
}

/** Admin list — GET /api/admin/banners?type=shop_hero */
export async function GET(request: Request) {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.trim();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      banners: !type || type === SHOP_HERO_BANNER_TYPE ? DEFAULT_SHOP_HERO_BANNERS : [],
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cms_banners")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = data ?? [];
  if (type) {
    rows = rows.filter(
      (r) => String(r.placement ?? "") === type || String(r.banner_type ?? "") === type
    );
  }

  return NextResponse.json({
    banners: rows.map((r) => mapCmsRowToShopHero(r as Record<string, unknown>)).filter(Boolean),
    raw: rows,
  });
}

/** Admin create — POST /api/admin/banners */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = (await request.json()) as Record<string, unknown>;
  const payload = toCmsPayload(body);
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
      {
        banner: {
          id: `mock-${Date.now()}`,
          ...payload,
          desktop_image: payload.image_url,
          mobile_image: payload.mobile_image_url,
          link: payload.link_url,
          type: payload.banner_type,
        },
      },
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
