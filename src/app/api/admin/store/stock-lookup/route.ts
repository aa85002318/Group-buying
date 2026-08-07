import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const PRODUCT_FIELDS =
  "id, name, sku, barcode, image_url, unit, supplier_name, brand_id, price, stock, short_name, brands(name)";

function withBrand(row: Record<string, unknown>): ProductRow {
  const brands = row.brands as { name?: string } | { name?: string }[] | null | undefined;
  const brandName = Array.isArray(brands) ? brands[0]?.name : brands?.name;
  const rest = { ...row };
  delete rest.brands;
  return { ...(rest as ProductRow), brand: brandName ?? null };
}

type ProductRow = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  stock?: number | null;
  price?: number | null;
  unit?: string | null;
  image_url?: string | null;
  supplier_name?: string | null;
  [key: string]: unknown;
};

/**
 * Cross-store stock lookup — read-only.
 * Does not mutate inventory. store_staff may view other stores' quantities.
 */
export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const productIdParam = url.searchParams.get("product_id")?.trim() ?? "";

  if (!q && !productIdParam) {
    return NextResponse.json({ error: "請輸入商品名稱、條碼或 SKU" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      products: [
        {
          id: "mock-1",
          name: "DEMO 高筋麵粉",
          sku: "DEMO-001",
          barcode: q || "4710000000001",
          brand: "DEMO",
          stock: 24,
          price: 120,
          unit: "包",
        },
      ],
      selected: {
        product: {
          id: "mock-1",
          name: "DEMO 高筋麵粉",
          sku: "DEMO-001",
          barcode: q || "4710000000001",
          brand: "DEMO",
          stock: 24,
          price: 120,
          unit: "包",
        },
        stores: [
          {
            store_id: "s1",
            store_name: "復興店",
            quantity: 10,
            available_quantity: 10,
            batch_quantity: 10,
            nearest_expiry: null,
            batch_count: 1,
          },
          {
            store_id: "s2",
            store_name: "信義店",
            quantity: 6,
            available_quantity: 6,
            batch_quantity: 6,
            nearest_expiry: null,
            batch_count: 1,
          },
        ],
        total_quantity: 16,
        note: "查詢結果僅供參考，不會直接修改其他分店庫存。",
      },
    });
  }

  const admin = createAdminClient();

  let candidates: ProductRow[] = [];

  if (productIdParam) {
    const { data } = await admin
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("id", productIdParam)
      .maybeSingle();
    if (data) candidates = [withBrand(data as Record<string, unknown>)];
  } else {
    const { data: byBarcode } = await admin
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("barcode", q)
      .maybeSingle();
    if (byBarcode) {
      candidates = [withBrand(byBarcode as Record<string, unknown>)];
    } else {
      const { data: bySku } = await admin
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("sku", q)
        .maybeSingle();
      if (bySku) {
        candidates = [withBrand(bySku as Record<string, unknown>)];
      } else {
        const { data: batchHit } = await admin
          .from("store_batches")
          .select(`product_id, products(${PRODUCT_FIELDS})`)
          .eq("barcode", q)
          .limit(1)
          .maybeSingle();
        const nested = batchHit?.products as unknown;
        if (nested && typeof nested === "object" && !Array.isArray(nested)) {
          candidates = [withBrand(nested as Record<string, unknown>)];
        } else {
          const { data: search } = await admin
            .from("products")
            .select(PRODUCT_FIELDS)
            .or(
              `name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%,short_name.ilike.%${q}%`
            )
            .order("updated_at", { ascending: false })
            .limit(8);
          candidates = (search ?? []).map((row) =>
            withBrand(row as Record<string, unknown>)
          );
        }
      }
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      products: [],
      selected: null,
      note: "查詢結果僅供參考，不會直接修改其他分店庫存。",
    });
  }

  const selectedProduct = candidates[0]!;
  const productId = selectedProduct.id;

  const [{ data: stores }, { data: inventoryRows }, { data: batches }] = await Promise.all([
    admin
      .from("stores")
      .select("id, name, code, is_active")
      .eq("is_active", true)
      .order("name"),
    admin
      .from("store_inventory")
      .select("store_id, quantity, unit, updated_at")
      .eq("product_id", productId),
    admin
      .from("store_batches")
      .select(
        "store_id, remaining_quantity, quantity, expiry_date, status, batch_no, location"
      )
      .eq("product_id", productId)
      .eq("status", "active"),
  ]);

  const invByStore = new Map(
    (inventoryRows ?? []).map((r) => [r.store_id as string, r])
  );

  type BatchAgg = {
    qty: number;
    nearest: string | null;
    count: number;
  };
  const batchByStore = new Map<string, BatchAgg>();
  for (const b of batches ?? []) {
    const sid = b.store_id as string;
    const qty = Number(b.remaining_quantity ?? b.quantity ?? 0);
    const prev = batchByStore.get(sid) ?? { qty: 0, nearest: null, count: 0 };
    prev.qty += qty;
    prev.count += 1;
    const exp = b.expiry_date as string | null;
    if (exp && (!prev.nearest || exp < prev.nearest)) prev.nearest = exp;
    batchByStore.set(sid, prev);
  }

  const storeRows = (stores ?? []).map((s) => {
    const inv = invByStore.get(s.id);
    const batch = batchByStore.get(s.id);
    const invQty = inv != null ? Number(inv.quantity ?? 0) : null;
    const batchQty = batch?.qty ?? 0;
    // Prefer store_inventory; fall back to active batch sum
    const quantity = invQty != null ? invQty : batchQty;
    const available = quantity; // no reservation deduction yet — read-only display
    return {
      store_id: s.id,
      store_name: s.name,
      store_code: s.code ?? null,
      quantity,
      available_quantity: available,
      batch_quantity: batchQty,
      nearest_expiry: batch?.nearest ?? null,
      batch_count: batch?.count ?? 0,
      inventory_updated_at: inv?.updated_at ?? null,
      has_inventory_row: Boolean(inv),
    };
  });

  // Include stores that have stock but were filtered (shouldn't happen if active)
  const knownIds = new Set(storeRows.map((r) => r.store_id));
  for (const [sid, batch] of Array.from(batchByStore.entries())) {
    if (knownIds.has(sid)) continue;
    const inv = invByStore.get(sid);
    const invQty = inv != null ? Number(inv.quantity ?? 0) : batch.qty;
    storeRows.push({
      store_id: sid,
      store_name: "其他分店",
      store_code: null,
      quantity: invQty,
      available_quantity: invQty,
      batch_quantity: batch.qty,
      nearest_expiry: batch.nearest,
      batch_count: batch.count,
      inventory_updated_at: inv?.updated_at ?? null,
      has_inventory_row: Boolean(inv),
    });
  }

  storeRows.sort((a, b) => {
    if (b.available_quantity !== a.available_quantity) {
      return b.available_quantity - a.available_quantity;
    }
    return String(a.store_name).localeCompare(String(b.store_name), "zh-Hant");
  });

  const totalQuantity = storeRows.reduce((s, r) => s + Number(r.available_quantity || 0), 0);

  return NextResponse.json({
    products: candidates.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku ?? null,
      barcode: p.barcode ?? null,
      brand: p.brand ?? null,
      stock: p.stock ?? null,
      price: p.price ?? null,
      unit: p.unit ?? null,
      image_url: p.image_url ?? null,
      supplier_name: p.supplier_name ?? null,
    })),
    selected: {
      product: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku ?? null,
        barcode: selectedProduct.barcode ?? null,
        brand: selectedProduct.brand ?? null,
        stock: selectedProduct.stock ?? null,
        price: selectedProduct.price ?? null,
        unit: selectedProduct.unit ?? null,
        image_url: selectedProduct.image_url ?? null,
        supplier_name: selectedProduct.supplier_name ?? null,
      },
      stores: storeRows,
      total_quantity: totalQuantity,
      note: "查詢結果僅供參考，不會直接修改其他分店庫存。",
    },
    note: "查詢結果僅供參考，不會直接修改其他分店庫存。",
  });
}
