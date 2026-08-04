import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const PRODUCT_FIELDS =
  "id, name, sku, barcode, image_url, unit, specifications, package_spec, supplier_id, supplier_name, brand_id, category_id, cost_price, price, stock, short_name, brands(name)";

function withBrand<T extends Record<string, unknown>>(row: T) {
  const brands = row.brands as { name?: string } | { name?: string }[] | null | undefined;
  const brandName = Array.isArray(brands) ? brands[0]?.name : brands?.name;
  const { brands: _b, ...rest } = row;
  return { ...rest, brand: brandName ?? null };
}

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ error: "請輸入條碼或 SKU" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      product: {
        id: "mock-1",
        name: "DEMO 商品",
        sku: q,
        barcode: q,
        brand: "DEMO",
        stock: 12,
        price: 100,
        nearest_expiry: null,
        batch_qty: 0,
        matched_via: "mock",
      },
    });
  }

  const admin = createAdminClient();

  const { data: byBarcode } = await admin
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("barcode", q)
    .maybeSingle();

  let product = byBarcode;
  let matchedVia = "products.barcode";

  if (!product) {
    const { data: bySku } = await admin
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("sku", q)
      .maybeSingle();
    product = bySku;
    matchedVia = "products.sku";
  }

  if (!product) {
    const { data: batch } = await admin
      .from("store_batches")
      .select(`product_id, products(${PRODUCT_FIELDS})`)
      .eq("barcode", q)
      .limit(1)
      .maybeSingle();
    const nested = batch?.products as unknown;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      product = nested as NonNullable<typeof product>;
      matchedVia = "store_batches.barcode";
    }
  }

  if (!product) {
    return NextResponse.json({ product: null });
  }

  const { data: batches } = await admin
    .from("store_batches")
    .select("id, batch_no, expiry_date, remaining_quantity, quantity, status, location")
    .eq("product_id", product.id)
    .order("expiry_date", { ascending: true })
    .limit(20);

  const active = (batches ?? []).filter((b) => (b.status ?? "active") === "active");
  const nearest = active.find((b) => b.expiry_date)?.expiry_date ?? null;
  const batchQty = active.reduce(
    (s, b) => s + Number(b.remaining_quantity ?? b.quantity ?? 0),
    0
  );

  return NextResponse.json({
    product: {
      ...withBrand(product as Record<string, unknown>),
      nearest_expiry: nearest,
      batch_qty: batchQty,
      matched_via: matchedVia,
      batches: active,
    },
  });
}
