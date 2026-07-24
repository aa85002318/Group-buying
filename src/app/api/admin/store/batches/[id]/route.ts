import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordInventoryMovement,
  syncInventoryFromBatches,
} from "@/lib/admin/inventory-movements";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireStoreOps();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("store_batches")
    .select("*, products(id, name, sku, barcode, image_url, unit, supplier_name)")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "找不到批次" }, { status: 404 });
  }

  const [{ data: disposals }, { data: returns }, { data: anomalies }, { data: movements }] =
    await Promise.all([
      admin.from("store_disposals").select("*").eq("batch_id", id).order("created_at", { ascending: false }).limit(20),
      admin.from("store_returns").select("*").eq("batch_id", id).order("created_at", { ascending: false }).limit(20),
      admin.from("store_anomalies").select("*").eq("batch_id", id).order("created_at", { ascending: false }).limit(20),
      admin
        .from("inventory_movements")
        .select("*")
        .eq("batch_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  return NextResponse.json({
    batch: data,
    disposals: disposals ?? [],
    returns: returns ?? [],
    anomalies: anomalies ?? [],
    movements: movements ?? [],
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ batch: { id, ...body } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_batches").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "找不到批次" }, { status: 404 });

  // Never allow changing product_id to create a new product relationship casually —
  // product_id locked to existing batch product.
  const updates: Record<string, unknown> = {};
  const allowed = [
    "batch_no",
    "barcode",
    "quantity",
    "remaining_quantity",
    "expiry_date",
    "manufactured_at",
    "received_at",
    "cost_price",
    "location",
    "notes",
    "status",
    "supplier_id",
  ] as const;
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error: updateError } = await admin
    .from("store_batches")
    .update(updates)
    .eq("id", id)
    .select("*, products(id, name, sku, barcode)")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (
    updates.remaining_quantity != null &&
    Number(updates.remaining_quantity) !== Number(old.remaining_quantity ?? old.quantity)
  ) {
    const before = Number(old.remaining_quantity ?? old.quantity ?? 0);
    const after = Number(updates.remaining_quantity);
    await recordInventoryMovement({
      storeId: old.store_id,
      productId: old.product_id,
      batchId: id,
      movementType: "adjust",
      quantityDelta: after - before,
      quantityBefore: before,
      quantityAfter: after,
      createdBy: auth!.profile.id,
      notes: "批次剩餘量調整",
    });
    await syncInventoryFromBatches(old.store_id, old.product_id);
  }

  await logAudit(auth!.profile.id, "update", "store_batches", id, old, data, request as never);
  return NextResponse.json({ batch: data });
}
