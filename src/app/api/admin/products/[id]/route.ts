import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchProductPickupStoreIds,
  syncProductPickupStores,
} from "@/lib/services/productPickupStores";

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
    description: body.description,
    short_description: body.short_description,
    specifications: body.specifications,
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
    max_quantity_per_user: body.max_quantity_per_user,
    supplier_name: body.supplier_name,
    product_info: body.product_info,
    disclaimer: body.product_info ?? body.disclaimer,
    status: status ?? (is_active === false ? "inactive" : "active"),
    sort_order: body.sort_order,
    expected_arrival_date: body.expected_arrival_date,
    preorder_deadline: body.preorder_deadline,
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
    .select("*, product_categories(name, slug)")
    .eq("id", id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  const pickup_store_ids = await fetchProductPickupStoreIds(admin, id);
  return NextResponse.json({
    product: {
      ...data,
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
  const { data: old } = await admin.from("products").select("*").eq("id", id).single();
  const { error } = await admin.from("products").update({ is_active: false, status: "inactive" }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete", "product", id, old, { status: "inactive" }, _request as never);
  return NextResponse.json({ ok: true });
}
