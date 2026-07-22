import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  attachPickupStoresToProducts,
  syncProductPickupStores,
} from "@/lib/services/productPickupStores";
import {
  attachProductRelations,
  syncAllProductRelations,
} from "@/lib/services/productRelations";
import {
  syncProductChannels,
  type ProductChannel,
} from "@/lib/services/productChannelService";

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
  const status = body.status ?? (body.is_active !== false ? "active" : "inactive");
  const is_active = status === "active";

  return {
    name: body.name,
    subtitle: body.subtitle ?? null,
    sku: body.sku ?? null,
    category_id: body.category_id ?? (Array.isArray(body.category_ids) ? body.category_ids[0] : null) ?? null,
    brand_id: body.brand_id ?? null,
    supplier_id: body.supplier_id ?? null,
    description: body.description ?? body.rich_description ?? null,
    rich_description: body.rich_description ?? body.description ?? null,
    specifications: body.specifications ?? null,
    price: body.price,
    sale_price: body.sale_price ?? body.price ?? null,
    original_price: body.original_price ?? null,
    live_price: body.live_price ?? null,
    vip_price: body.vip_price ?? null,
    cost_price: body.cost_price ?? null,
    gross_margin: body.gross_margin ?? null,
    stock: body.stock ?? 100,
    preorder_stock: body.preorder_stock ?? 0,
    safety_stock: body.safety_stock ?? 0,
    min_stock_alert: body.min_stock_alert ?? 0,
    inventory_mode: body.inventory_mode ?? "stock",
    preorder_note: body.preorder_note ?? null,
    auto_deduct_stock: body.auto_deduct_stock !== false,
    allow_oversell: Boolean(body.allow_oversell),
    temp_ambient: body.temp_ambient !== false,
    temp_chilled: Boolean(body.temp_chilled),
    temp_frozen: Boolean(body.temp_frozen),
    ship_home: body.ship_home !== false,
    ship_cvs: Boolean(body.ship_cvs),
    ship_store_pickup: body.ship_store_pickup !== false,
    weight_grams: body.weight_grams ?? null,
    dimensions: body.dimensions ?? null,
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
    seo_keywords: body.seo_keywords ?? null,
    slug: body.slug ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    is_featured: Boolean(body.is_featured),
    is_hot: Boolean(body.is_hot),
    is_new: Boolean(body.is_new),
    is_weekly_pick: Boolean(body.is_weekly_pick),
    is_closing_soon: Boolean(body.is_closing_soon),
    sort_order: body.sort_order ?? 0,
    image_url: image_url ?? null,
    images: images ?? [],
    is_active,
    status,
    is_group_buy: Boolean(body.is_group_buy),
    group_buy_start_at: body.group_buy_start_at ?? null,
    group_buy_end_at: body.group_buy_end_at ?? null,
    max_quantity_per_user: body.max_quantity_per_user ?? null,
    supplier_name: body.supplier_name ?? null,
    product_info: body.product_info ?? null,
    disclaimer: body.product_info ?? body.disclaimer ?? null,
    expected_arrival_date: body.expected_arrival_date ?? null,
    barcode: body.barcode ?? null,
    unit: body.unit ?? null,
    video_url: body.video_url ?? null,
    website_price: body.website_price ?? null,
    group_buy_price: body.group_buy_price ?? null,
    msrp: body.msrp ?? null,
    publish_website: body.publish_website !== false,
    publish_group_buy: body.publish_group_buy !== false,
    publish_store: body.publish_store !== false,
    product_scope:
      body.product_scope === "chime_select" ? "chime_select" : "baking",
  };
}

async function maybeSyncChannels(productId: string, body: Record<string, unknown>) {
  if (!Array.isArray(body.channels)) return;
  const channels = (body.channels as string[]).filter((c): c is ProductChannel =>
    ["website", "group_buy", "store_only", "hidden"].includes(c)
  );
  await syncProductChannels(productId, channels);
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
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const normalized = (data ?? []).map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
  }));

  const withPickup = await attachPickupStoresToProducts(admin, normalized);
  const products = await attachProductRelations(admin, withPickup);
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
    await syncAllProductRelations(admin, data.id, body);
    await maybeSyncChannels(data.id, body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "關聯資料儲存失敗";
    if (!message.includes("does not exist") && !message.includes("relation")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  await logAudit(auth!.profile.id, "create", "product", data.id, null, data, request as never);
  return NextResponse.json({ product: { ...data, pickup_store_ids } });
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

  try {
    if (pickup_store_ids !== undefined) {
      await syncProductPickupStores(admin, id, pickup_store_ids);
    }
    await syncAllProductRelations(admin, id, body);
    await maybeSyncChannels(id, body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "關聯資料儲存失敗";
    if (!message.includes("does not exist") && !message.includes("relation")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  await logAudit(auth!.profile.id, "update", "product", id, old, data, request as never);
  return NextResponse.json({
    product: { ...data, pickup_store_ids: pickup_store_ids ?? [] },
  });
}
