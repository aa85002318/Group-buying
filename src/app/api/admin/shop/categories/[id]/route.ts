import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  isReservedCategoryName,
  normalizeCategoryHex,
} from "@/lib/shop/categories";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/shop/categories/[id] */
export async function PATCH(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (isReservedCategoryName(name)) {
      return NextResponse.json(
        { error: "全部分類為系統固定項目，無須另外新增。" },
        { status: 400 }
      );
    }
    updates.name = name;
  }
  if (body.slug !== undefined) updates.slug = String(body.slug).trim();
  if (body.description !== undefined) {
    updates.description = body.description ? String(body.description).trim() : null;
  }
  if (body.image_url !== undefined || body.shop_home_icon !== undefined) {
    const img = body.image_url ?? body.shop_home_icon;
    updates.shop_home_icon = img ? String(img).trim() : null;
  }
  if (body.icon_url !== undefined) {
    updates.icon_url = body.icon_url ? String(body.icon_url).trim() : null;
  }
  if (body.background_color !== undefined || body.shop_home_bg_color !== undefined) {
    const bg = normalizeCategoryHex(
      String(body.background_color ?? body.shop_home_bg_color ?? "")
    );
    if (!bg) {
      return NextResponse.json({ error: "背景顏色須為 #RRGGBB" }, { status: 400 });
    }
    updates.shop_home_bg_color = bg;
  }
  if (body.sort_order !== undefined || body.shop_home_sort_order !== undefined) {
    const n = Number(body.shop_home_sort_order ?? body.sort_order);
    if (!Number.isInteger(n)) {
      return NextResponse.json({ error: "sort_order 須為整數" }, { status: 400 });
    }
    updates.shop_home_sort_order = n;
  }
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.is_main_category !== undefined) {
    updates.is_main_category = Boolean(body.is_main_category);
  }
  if (body.show_on_shop_home !== undefined) {
    updates.show_on_shop_home = Boolean(body.show_on_shop_home);
  }
  if (body.custom_link !== undefined) {
    updates.custom_link = body.custom_link ? String(body.custom_link).trim() : null;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ category: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("product_categories").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "分類不存在" }, { status: 404 });

  if (updates.slug) {
    const { data: clash } = await admin
      .from("product_categories")
      .select("id")
      .eq("slug", updates.slug)
      .neq("id", id)
      .maybeSingle();
    if (clash) {
      return NextResponse.json({ error: "slug 已存在" }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from("product_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "product_category", id, old, data, request as never);
  return NextResponse.json({ category: data });
}

/**
 * DELETE /api/admin/shop/categories/[id]
 * Blocks hard delete when products or child categories exist.
 */
export async function DELETE(request: Request, context: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const forceDeactivate = searchParams.get("deactivate") === "1";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("product_categories").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "分類不存在" }, { status: 404 });

  const [{ count: productCount }, { count: childCount }] = await Promise.all([
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id),
    admin
      .from("product_categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id),
  ]);

  if ((productCount ?? 0) > 0 || (childCount ?? 0) > 0) {
    if (forceDeactivate) {
      const { data, error } = await admin
        .from("product_categories")
        .update({ is_active: false, show_on_shop_home: false })
        .eq("id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAudit(
        auth!.profile.id,
        "update",
        "product_category",
        id,
        old,
        data,
        request as never
      );
      return NextResponse.json({
        ok: true,
        deactivated: true,
        message: "此分類仍有商品或子分類使用，已改為停用。",
      });
    }

    return NextResponse.json(
      {
        error: "此分類仍有商品使用，請先移動商品，或將分類設為停用。",
        product_count: productCount ?? 0,
        child_count: childCount ?? 0,
        can_deactivate: true,
      },
      { status: 409 }
    );
  }

  const { error } = await admin.from("product_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete", "product_category", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
