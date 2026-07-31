import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { mapCmsRowToShopHero, SHOP_HERO_BANNER_TYPE } from "@/types/shop-hero-banner";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function toCmsUpdates(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  if (body.title != null) updates.title = String(body.title).trim();
  if (body.subtitle !== undefined) updates.subtitle = body.subtitle ? String(body.subtitle) : null;
  if (body.desktop_image != null || body.image_url != null) {
    updates.image_url = String(body.desktop_image ?? body.image_url ?? "").trim() || null;
  }
  if (body.mobile_image !== undefined || body.mobile_image_url !== undefined) {
    const m = body.mobile_image ?? body.mobile_image_url;
    updates.mobile_image_url = m ? String(m).trim() : null;
  }
  if (body.link !== undefined || body.link_url !== undefined) {
    updates.link_url = body.link != null ? String(body.link).trim() : body.link_url != null ? String(body.link_url).trim() : null;
  }
  if (body.button_text !== undefined) {
    updates.button_text = body.button_text ? String(body.button_text).trim() : null;
  }
  if (body.sort_order != null) updates.sort_order = Number(body.sort_order) || 0;
  if (body.is_active != null) {
    updates.is_active = Boolean(body.is_active);
    updates.status = body.is_active ? "active" : "inactive";
  }
  if (body.type != null) {
    const type = String(body.type).trim() || SHOP_HERO_BANNER_TYPE;
    updates.placement = type;
    updates.banner_type = type;
  }
  return updates;
}

/** PATCH /api/admin/banners/[id] */
export async function PATCH(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const updates = toCmsUpdates(body);
  updates.updated_by = auth!.profile.id;

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

/** DELETE /api/admin/banners/[id] */
export async function DELETE(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("cms_banners").select("*").eq("id", id).single();
  const { error } = await admin.from("cms_banners").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "cms_banner", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
