import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchProductPickupStoreIds,
  syncProductPickupStores,
} from "@/lib/services/productPickupStores";
import { resolveProductDisclaimer } from "@/lib/products/disclaimer";
import { cleanRichTextHtml } from "@/lib/cms/safeHtml";

function mapProductBody(body: Record<string, unknown>) {
  const status = body.status as string | undefined;
  const is_active =
    status === "active"
      ? true
      : status === "inactive" || status === "draft"
        ? false
        : body.is_active !== false;

  const images = Array.isArray(body.images)
    ? (body.images as string[]).filter((u) => typeof u === "string" && u.trim())
    : undefined;

  return {
    name: body.name,
    slug: body.slug,
    description:
      body.description !== undefined
        ? cleanRichTextHtml(String(body.description ?? "")) || null
        : undefined,
    rich_description:
      body.rich_description !== undefined || body.description !== undefined
        ? cleanRichTextHtml(
            String(body.rich_description ?? body.description ?? "")
          ) || null
        : undefined,
    short_description: body.short_description,
    specifications:
      body.specifications !== undefined
        ? cleanRichTextHtml(String(body.specifications ?? "")) || null
        : undefined,
    price: body.price,
    sale_price: body.sale_price ?? body.price,
    original_price: body.original_price,
    cost_price: body.cost_price,
    stock: body.stock,
    category_id: body.category_id,
    image_url: body.image_url ?? images?.[0],
    images,
    is_active,
    is_group_buy: body.is_group_buy,
    group_buy_start_at: body.group_buy_start_at,
    group_buy_end_at: body.group_buy_end_at,
    is_monthly_group_buy: body.is_monthly_group_buy,
    is_limited_product: body.is_limited_product,
    group_buy_category_id: body.group_buy_category_id,
    max_quantity_per_user: body.max_quantity_per_user,
    supplier_name: body.supplier_name,
    product_info:
      body.product_info !== undefined
        ? cleanRichTextHtml(String(body.product_info ?? "")) || null
        : undefined,
    disclaimer:
      body.disclaimer !== undefined
        ? resolveProductDisclaimer(
            typeof body.disclaimer === "string" ? body.disclaimer : undefined
          )
        : undefined,
    is_featured: body.is_featured,
    is_hot: body.is_hot,
    is_new: body.is_new,
    hot_sort_order: body.hot_sort_order,
    new_sort_order: body.new_sort_order,
    new_until: body.new_until !== undefined ? body.new_until || null : undefined,
    status: status ?? (is_active === false ? "inactive" : "active"),
    sort_order: body.sort_order,
    expected_arrival_date: body.expected_arrival_date,
    preorder_deadline: body.preorder_deadline,
    product_scope:
      body.product_scope === "chime_select" ? "chime_select" : body.product_scope === "baking" ? "baking" : undefined,
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ product: { id, pickup_store_ids: [] } });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("products")
    .select("*, product_categories:product_categories!products_category_id_fkey(name, slug), primary_category:product_categories!products_primary_category_id_fkey(name, slug)")
    .eq("id", id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  const pickup_store_ids = await fetchProductPickupStoreIds(admin, id);
  const category =
    (data.product_categories as { name?: string } | null) ??
    (data.primary_category as { name?: string } | null) ??
    null;
  return NextResponse.json({
    product: {
      ...data,
      product_categories: category,
      images: Array.isArray(data.images) ? data.images : data.image_url ? [data.image_url] : [],
      pickup_store_ids,
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const pickup_store_ids = Array.isArray(body.pickup_store_ids)
    ? (body.pickup_store_ids as string[])
    : undefined;

  const updates = Object.fromEntries(
    Object.entries(mapProductBody(body)).filter(([, v]) => v !== undefined)
  );

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ product: { id, ...updates, pickup_store_ids } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("products").select("*").eq("id", id).single();
  const { data, error } = await admin.from("products").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (pickup_store_ids !== undefined) {
    try {
      await syncProductPickupStores(admin, id, pickup_store_ids);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "取貨門市儲存失敗" },
        { status: 500 }
      );
    }
  }

  await logAudit(auth!.profile.id, "update", "product", id, old, data, request as never);
  return NextResponse.json({
    product: { ...data, pickup_store_ids: pickup_store_ids ?? [] },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("products").select("id, name, sku").eq("id", id).maybeSingle();
  if (!old) {
    return NextResponse.json({ error: "找不到商品" }, { status: 404 });
  }

  const { count: orderCount } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if ((orderCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "此商品已有訂單紀錄，無法刪除。請改為下架以保留歷史訂單。", code: "has_orders" },
      { status: 409 }
    );
  }

  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) {
    const blocked = /foreign key|violates foreign key/i.test(error.message);
    return NextResponse.json(
      {
        error: blocked
          ? "此商品仍被其他資料引用，無法刪除。請改為下架。"
          : error.message,
        code: blocked ? "in_use" : undefined,
      },
      { status: blocked ? 409 : 500 }
    );
  }

  await logAudit(auth!.profile.id, "delete", "product", id, old, null, _request as never);
  return NextResponse.json({ ok: true });
}
