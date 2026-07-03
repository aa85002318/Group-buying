import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  attachPickupStoresToProducts,
  syncProductPickupStores,
} from "@/lib/services/productPickupStores";

function normalizeImages(body: Record<string, unknown>) {
  const images = Array.isArray(body.images)
    ? (body.images as string[]).filter((u) => typeof u === "string" && u.trim())
    : undefined;
  const image_url =
    typeof body.image_url === "string"
      ? body.image_url
      : images?.length
        ? images[0]
        : undefined;
  return { images, image_url };
}

function mapProductRow(body: Record<string, unknown>) {
  const { images, image_url } = normalizeImages(body);
  const is_active = body.is_active !== false;
  return {
    name: body.name,
    category_id: body.category_id ?? null,
    description: body.description ?? null,
    specifications: body.specifications ?? null,
    price: body.price,
    sale_price: body.sale_price ?? body.price ?? null,
    original_price: body.original_price ?? null,
    cost_price: body.cost_price ?? null,
    stock: body.stock ?? 100,
    image_url: image_url ?? null,
    images: images ?? [],
    is_active,
    is_group_buy: Boolean(body.is_group_buy),
    group_buy_start_at: body.group_buy_start_at ?? null,
    group_buy_end_at: body.group_buy_end_at ?? null,
    max_quantity_per_user: body.max_quantity_per_user ?? null,
    supplier_name: body.supplier_name ?? null,
    product_info: body.product_info ?? null,
    disclaimer: body.product_info ?? body.disclaimer ?? null,
    status: is_active ? "active" : "inactive",
  };
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  if (!isSupabaseConfigured()) {
    let products = [...mockProducts];
    if (search) products = products.filter((p) => p.name.includes(search));
    return NextResponse.json({ products });
  }

  const admin = createAdminClient();
  let query = admin
    .from("products")
    .select("*, product_categories(name, slug)")
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const normalized = (data ?? []).map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
  }));

  const products = await attachPickupStoresToProducts(admin, normalized);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const pickup_store_ids = Array.isArray(body.pickup_store_ids)
    ? (body.pickup_store_ids as string[])
    : [];
  const row = mapProductRow(body);

  if (!isSupabaseConfigured()) {
    const product = {
      id: `prod-${Date.now()}`,
      ...row,
      pickup_store_ids,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json({ product });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("products").insert(row).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await syncProductPickupStores(admin, data.id, pickup_store_ids);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "取貨門市儲存失敗" },
      { status: 500 }
    );
  }

  await logAudit(auth!.profile.id, "create", "product", data.id, null, data, request as never);
  return NextResponse.json({
    product: { ...data, pickup_store_ids },
  });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "缺少商品 ID" }, { status: 400 });

  const pickup_store_ids = Array.isArray(body.pickup_store_ids)
    ? (body.pickup_store_ids as string[])
    : undefined;
  const row = mapProductRow(body);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      product: { id, ...row, pickup_store_ids, updated_at: new Date().toISOString() },
    });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("products").select("*").eq("id", id).single();
  const { data, error } = await admin.from("products").update(row).eq("id", id).select().single();
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
