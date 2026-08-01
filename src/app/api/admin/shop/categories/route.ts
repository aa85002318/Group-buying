import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  isReservedCategoryName,
  normalizeCategoryHex,
} from "@/lib/shop/categories";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/categories — shop main categories for CMS */
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_categories")
    .select(
      "id, name, slug, description, icon_url, shop_home_icon, shop_home_bg_color, shop_home_sort_order, sort_order, is_active, is_main_category, show_on_shop_home, custom_link, parent_id, updated_at"
    )
    .order("shop_home_sort_order", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

/** POST /api/admin/shop/categories */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "分類名稱必填" }, { status: 400 });
  }
  if (isReservedCategoryName(name)) {
    return NextResponse.json(
      { error: "全部分類為系統固定項目，無須另外新增。" },
      { status: 400 }
    );
  }

  const bg = normalizeCategoryHex(String(body.background_color ?? body.shop_home_bg_color ?? "#FFF4CC"));
  if (!bg) {
    return NextResponse.json({ error: "背景顏色須為 #RRGGBB" }, { status: 400 });
  }

  const slug =
    String(body.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "") ||
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "");

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { category: { id: `mock-${Date.now()}`, name, slug } },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("product_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "slug 已存在" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("product_categories")
    .insert({
      name,
      slug,
      description: body.description ? String(body.description).trim() : null,
      shop_home_icon: body.image_url || body.shop_home_icon || body.icon_url || null,
      icon_url: body.image_url || body.icon_url || null,
      shop_home_bg_color: bg,
      shop_home_sort_order: Number(body.sort_order ?? body.shop_home_sort_order ?? 100) || 100,
      sort_order: Number(body.sort_order ?? 100) || 100,
      is_active: body.is_active !== false,
      is_main_category: body.is_main_category !== false,
      show_on_shop_home: body.show_on_shop_home !== false,
      custom_link: body.custom_link ? String(body.custom_link).trim() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "product_category", data.id, null, data, request as never);
  return NextResponse.json({ category: data }, { status: 201 });
}
