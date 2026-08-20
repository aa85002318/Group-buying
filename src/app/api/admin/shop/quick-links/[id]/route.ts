import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { parseShopQuickLink } from "@/lib/shop/quick-links";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/shop/quick-links/[id] */
export async function PATCH(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = parseShopQuickLink({ ...body, id });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ link: parsed });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_quick_links").select("*").eq("id", id).maybeSingle();
  if (!old) return NextResponse.json({ error: "快捷入口不存在" }, { status: 404 });

  const { data, error } = await admin
    .from("shop_quick_links")
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update", "shop_quick_links", id, old, data, request as never);
  return NextResponse.json({ link: parseShopQuickLink(data as Record<string, unknown>) });
}

/** DELETE /api/admin/shop/quick-links/[id] */
export async function DELETE(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_quick_links").select("*").eq("id", id).maybeSingle();
  const { error } = await admin.from("shop_quick_links").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete", "shop_quick_links", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
