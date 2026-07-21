import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ pages: [], banners: [], blocks: [] });
  }

  const type = new URL(request.url).searchParams.get("type") ?? "all";
  const admin = createAdminClient();

  if (type === "banners") {
    const { data } = await admin.from("cms_banners").select("*").order("sort_order");
    return NextResponse.json({ banners: data ?? [] });
  }
  if (type === "blocks") {
    const { data } = await admin.from("homepage_blocks").select("*").order("sort_order");
    return NextResponse.json({ blocks: data ?? [] });
  }
  if (type === "pages") {
    const { data } = await admin.from("cms_pages").select("*").order("updated_at", { ascending: false });
    return NextResponse.json({ pages: data ?? [] });
  }

  const [pages, banners, blocks] = await Promise.all([
    admin.from("cms_pages").select("*").order("updated_at", { ascending: false }),
    admin.from("cms_banners").select("*").order("sort_order"),
    admin.from("homepage_blocks").select("*").order("sort_order"),
  ]);

  return NextResponse.json({
    pages: pages.data ?? [],
    banners: banners.data ?? [],
    blocks: blocks.data ?? [],
  });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const kind = body.kind as "page" | "banner" | "block";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: body }, { status: 201 });
  }

  const admin = createAdminClient();

  if (kind === "page") {
    const { data, error } = await admin
      .from("cms_pages")
      .insert({
        slug: body.slug,
        title: body.title,
        content: body.content ?? null,
        is_published: Boolean(body.is_published),
        seo_title: body.seo_title ?? null,
        seo_description: body.seo_description ?? null,
        updated_by: auth!.profile.id,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(auth!.profile.id, "create", "cms_page", data.id, null, data, request as never);
    return NextResponse.json({ page: data }, { status: 201 });
  }

  if (kind === "banner") {
    if (body.link_url) {
      const { isSafeLinkUrl } = await import("@/lib/cms/safeHtml");
      if (!isSafeLinkUrl(body.link_url)) {
        return NextResponse.json({ error: "連結不合法（禁止 javascript:）" }, { status: 400 });
      }
    }
    const { data, error } = await admin
      .from("cms_banners")
      .insert({
        title: body.title,
        subtitle: body.subtitle ?? null,
        image_url: body.image_url ?? null,
        mobile_image_url: body.mobile_image_url ?? null,
        link_url: body.link_url ?? null,
        button_text: body.button_text ?? null,
        placement: body.placement ?? "home_hero",
        status: body.status ?? "active",
        sort_order: body.sort_order ?? 0,
        is_active: body.is_active !== false,
        starts_at: body.starts_at ?? null,
        ends_at: body.ends_at ?? null,
        created_by: auth!.profile.id,
        updated_by: auth!.profile.id,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(auth!.profile.id, "create", "cms_banner", data.id, null, data, request as never);
    return NextResponse.json({ banner: data }, { status: 201 });
  }

  return NextResponse.json({ error: "未知 kind" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const kind = body.kind as "page" | "banner" | "block";
  const { id, ...updates } = body;
  delete updates.kind;

  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ item: { id, ...updates } });

  const admin = createAdminClient();
  const table =
    kind === "page" ? "cms_pages" : kind === "banner" ? "cms_banners" : "homepage_blocks";

  if (kind === "page") updates.updated_by = auth!.profile.id;
  if (kind === "banner") {
    if (updates.link_url) {
      const { isSafeLinkUrl } = await import("@/lib/cms/safeHtml");
      if (!isSafeLinkUrl(String(updates.link_url))) {
        return NextResponse.json({ error: "連結不合法" }, { status: 400 });
      }
    }
    updates.updated_by = auth!.profile.id;
  }

  const { data: old } = await admin.from(table).select("*").eq("id", id).single();
  const { data, error } = await admin.from(table).update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", table, id, old, data, request as never);
  return NextResponse.json({ item: data });
}
