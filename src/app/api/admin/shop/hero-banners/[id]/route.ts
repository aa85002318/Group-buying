import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { mapCmsRowToShopHero, SHOP_HERO_BANNER_TYPE } from "@/types/shop-hero-banner";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/shop/hero-banners/[id] */
export async function PATCH(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = { updated_by: auth!.profile.id };

  if (body.title != null) updates.title = String(body.title).trim();
  if (body.alt_text !== undefined) updates.alt_text = String(body.alt_text ?? "").trim();
  if (body.subtitle !== undefined) updates.subtitle = body.subtitle ? String(body.subtitle) : null;
  if (body.desktop_image_url != null || body.desktop_image != null || body.image_url != null) {
    updates.image_url = String(
      body.desktop_image_url ?? body.desktop_image ?? body.image_url ?? ""
    ).trim() || null;
  }
  if (
    body.mobile_image_url !== undefined ||
    body.mobile_image !== undefined
  ) {
    const m = body.mobile_image_url ?? body.mobile_image;
    updates.mobile_image_url = m ? String(m).trim() : null;
  }
  if (body.link_url !== undefined || body.link !== undefined) {
    const link = body.link_url ?? body.link;
    updates.link_url = link ? String(link).trim() : null;
  }
  if (body.link_target !== undefined) {
    updates.link_target = String(body.link_target).trim() === "_blank" ? "_blank" : "_self";
  }
  if (body.sort_order != null) updates.sort_order = Number(body.sort_order) || 0;
  if (body.is_active != null) {
    updates.is_active = Boolean(body.is_active);
    updates.status = body.is_active ? "active" : "inactive";
  }
  if (body.starts_at !== undefined) updates.starts_at = body.starts_at ? String(body.starts_at) : null;
  if (body.ends_at !== undefined) updates.ends_at = body.ends_at ? String(body.ends_at) : null;
  updates.placement = SHOP_HERO_BANNER_TYPE;
  updates.banner_type = SHOP_HERO_BANNER_TYPE;

  if (updates.link_url) {
    const { isSafeLinkUrl } = await import("@/lib/cms/safeHtml");
    if (!isSafeLinkUrl(String(updates.link_url))) {
      return NextResponse.json({ error: "連結不合法" }, { status: 400 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ banner: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("cms_banners").select("*").eq("id", id).single();
  const { data, error } = await admin
    .from("cms_banners")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "cms_banner", id, old, data, request as never);
  return NextResponse.json({ banner: mapCmsRowToShopHero(data as Record<string, unknown>) });
}

/** DELETE /api/admin/shop/hero-banners/[id] */
export async function DELETE(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("cms_banners").select("*").eq("id", id).single();
  const { error } = await admin.from("cms_banners").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "cms_banner", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
