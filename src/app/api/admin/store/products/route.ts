import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const PRODUCT_SELECT =
  "id, name, sku, barcode, image_url, stock, publish_store, supplier_id, supplier_name, brand_id, unit, short_name, safety_stock, is_active, price, cost_price, specifications, package_spec, brands(name)";

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 100) || 100);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ products: [] });
  }

  const admin = createAdminClient();
  let query = admin
    .from("products")
    .select(PRODUCT_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%,short_name.ilike.%${q}%`
    );
  }

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const products = (data ?? []).map((row) => {
    const brands = row.brands as { name?: string } | { name?: string }[] | null;
    const brandName = Array.isArray(brands) ? brands[0]?.name : brands?.name;
    return {
      ...row,
      brand: brandName ?? null,
      brands: undefined,
    };
  });

  return NextResponse.json({ products });
}

/** Quick-create product into Product Master (store staff allowed). */
export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "請填寫商品名稱" }, { status: 400 });
  }

  const barcode = String(body.barcode ?? "").trim() || null;
  const sku = String(body.sku ?? "").trim() || null;
  const unit = String(body.unit ?? "").trim() || null;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      product: {
        id: `prod-${Date.now()}`,
        name,
        barcode,
        sku,
        unit,
      },
    });
  }

  const admin = createAdminClient();

  if (barcode) {
    const { data: existing } = await admin
      .from("products")
      .select("id, name, sku, barcode, unit")
      .eq("barcode", barcode)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        product: existing,
        existing: true,
        message: "條碼已存在，已選用現有商品",
      });
    }
  }

  const row = {
    name,
    barcode,
    sku,
    unit,
    status: "active",
    is_active: true,
    publish_store: true,
    stock: 0,
  };

  const { data, error: insertError } = await admin
    .from("products")
    .insert(row)
    .select("id, name, sku, barcode, unit, image_url, stock")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await logAudit(
    auth!.profile.id,
    "create",
    "product",
    data.id,
    null,
    data,
    request as never
  );

  return NextResponse.json({ product: data }, { status: 201 });
}
