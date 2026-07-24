import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysFromNow, todayISO } from "@/lib/admin/store-ops";
import {
  recordInventoryMovement,
  syncInventoryFromBatches,
} from "@/lib/admin/inventory-movements";

/** List / create store batches (Store Ops V2 — no product creation). */
export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ batches: [] });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const productId = searchParams.get("product_id");
  const status = searchParams.get("status");
  const range = searchParams.get("range");
  const storeId = searchParams.get("store_id");

  const admin = createAdminClient();
  let query = admin
    .from("store_batches")
    .select(
      "*, products(id, name, sku, barcode, image_url, unit, supplier_name)"
    )
    .order("expiry_date", { ascending: true, nullsFirst: false })
    .limit(400);

  if (storeId) query = query.eq("store_id", storeId);
  if (productId) query = query.eq("product_id", productId);
  if (status) query = query.eq("status", status);

  if (range) {
    const today = todayISO();
    if (range === "expired") {
      query = query.lt("expiry_date", today).eq("status", "active");
    } else {
      const days = Number(range);
      if (!Number.isNaN(days) && days > 0) {
        query = query
          .gte("expiry_date", today)
          .lte("expiry_date", daysFromNow(days))
          .eq("status", "active");
      }
    }
  }

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  let batches = data ?? [];
  if (q) {
    const needle = q.toLowerCase();
    batches = batches.filter((b) => {
      const p = (b as { products?: { name?: string; sku?: string; barcode?: string } }).products;
      return (
        p?.name?.toLowerCase().includes(needle) ||
        p?.sku?.toLowerCase().includes(needle) ||
        p?.barcode?.toLowerCase().includes(needle) ||
        String(b.batch_no ?? "").toLowerCase().includes(needle) ||
        String(b.barcode ?? "").toLowerCase().includes(needle) ||
        String(b.location ?? "").toLowerCase().includes(needle)
      );
    });
  }

  return NextResponse.json({ batches });
}

/** Quick receive: create a new batch for an existing product (never creates products). */
export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ batch: { id: crypto.randomUUID(), ...body } }, { status: 201 });
  }

  const admin = createAdminClient();
  let productId = body.product_id as string | undefined;
  const barcode = body.barcode ? String(body.barcode).trim() : "";

  if (!productId && barcode) {
    const { data: p } = await admin
      .from("products")
      .select("id")
      .or(`barcode.eq.${barcode},sku.eq.${barcode}`)
      .maybeSingle();
    productId = p?.id;
  }

  if (!productId) {
    return NextResponse.json(
      {
        error:
          "找不到商品。請先至商品主檔 /admin/products 建立，或確認條碼正確。Store Ops 不會新增商品。",
      },
      { status: 400 }
    );
  }

  const qty = Number(body.quantity ?? 0);
  if (!qty || qty <= 0) {
    return NextResponse.json({ error: "數量必須大於 0" }, { status: 400 });
  }

  let storeId = body.store_id as string | undefined;
  if (!storeId) {
    const { data: store } = await admin
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    storeId = store?.id;
  }
  if (!storeId) {
    return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });
  }

  const payload = {
    store_id: storeId,
    product_id: productId,
    supplier_id: body.supplier_id ?? null,
    batch_no: String(body.batch_no ?? "").trim() || `B${Date.now()}`,
    barcode: barcode || null,
    quantity: qty,
    remaining_quantity: qty,
    expiry_date: body.expiry_date || null,
    manufactured_at: body.manufactured_at || null,
    received_at: body.received_at || todayISO(),
    cost_price: body.cost_price != null ? Number(body.cost_price) : null,
    location: body.location ? String(body.location) : null,
    notes: body.notes ? String(body.notes) : null,
    status: "active",
    created_by: auth!.profile.id,
  };

  const { data, error: insertError } = await admin
    .from("store_batches")
    .insert(payload)
    .select("*, products(id, name, sku, barcode)")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await recordInventoryMovement({
    storeId,
    productId,
    batchId: data.id,
    movementType: "receive",
    quantityDelta: qty,
    quantityBefore: 0,
    quantityAfter: qty,
    unitCost: payload.cost_price,
    referenceType: "store_batches",
    referenceId: data.id,
    createdBy: auth!.profile.id,
    notes: "快速進貨",
  });
  await syncInventoryFromBatches(storeId, productId);
  await logAudit(auth!.profile.id, "create", "store_batches", data.id, null, data, request as never);

  return NextResponse.json({ batch: data }, { status: 201 });
}
