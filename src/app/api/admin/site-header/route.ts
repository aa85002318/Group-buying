import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";

const ALLOWED_PAGE_KEYS = ["home", "products", "group_buy", "live", "videos", "articles"] as const;
type AllowedPageKey = (typeof ALLOWED_PAGE_KEYS)[number];

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      brandTitle: BRAND_NAME,
      brandSubtitle: BRAND_SUBTITLE,
      pageKeys: ["products", "group_buy", "live", "videos", "articles"],
      categoryIds: [],
    });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("site_header_settings")
    .select("brand_title,brand_subtitle,page_keys,category_ids")
    .eq("singleton_key", "main")
    .maybeSingle();

  return NextResponse.json({
    brandTitle: data?.brand_title ?? BRAND_NAME,
    brandSubtitle: data?.brand_subtitle ?? BRAND_SUBTITLE,
    pageKeys: (data?.page_keys as unknown as string[] | null) ?? ["products", "group_buy", "live", "videos", "articles"],
    categoryIds: (data?.category_ids as unknown as string[] | null) ?? [],
  });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));

  const brandTitle = typeof body.brandTitle === "string" ? body.brandTitle.trim() : "";
  const brandSubtitle = typeof body.brandSubtitle === "string" ? body.brandSubtitle.trim() : "";
  const pageKeys = Array.isArray(body.pageKeys) ? body.pageKeys : [];
  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

  if (!brandTitle || !brandSubtitle) {
    return NextResponse.json({ error: "請填寫品牌主標與副標" }, { status: 400 });
  }

  if (!isStringArray(pageKeys)) {
    return NextResponse.json({ error: "pageKeys 格式不正確" }, { status: 400 });
  }
  if (!pageKeys.every((k) => ALLOWED_PAGE_KEYS.includes(k as AllowedPageKey))) {
    return NextResponse.json({ error: "pageKeys 包含不允許的值" }, { status: 400 });
  }

  if (!isStringArray(categoryIds)) {
    return NextResponse.json({ error: "categoryIds 格式不正確" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    // local fallback: just respond ok
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error: upsertError } = await admin
    .from("site_header_settings")
    .upsert(
      {
        singleton_key: "main",
        brand_title: brandTitle,
        brand_subtitle: brandSubtitle,
        page_keys: pageKeys,
        category_ids: categoryIds,
        updated_at: now,
      },
      { onConflict: "singleton_key" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "update_site_header", "site_header_settings", "main", null, {
      brandTitle,
      brandSubtitle,
      pageKeys,
      categoryIds,
    });
  }

  return NextResponse.json({
    settings: data,
    ok: true,
  });
}

