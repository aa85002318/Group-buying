import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type BatchRow = {
  barcode?: string;
  product_id?: string;
  supplier_id?: string | null;
  batch_no?: string;
  quantity?: number;
  expiry_date?: string | null;
  cost_price?: number | null;
  notes?: string | null;
  location?: string | null;
};

type DisposalRow = {
  product_id?: string;
  batch_id?: string | null;
  quantity?: number;
  reason?: string | null;
  unit_cost?: number | null;
};

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const mode = body.mode as "expiry" | "disposal";
  const storeId = body.store_id as string | undefined;
  const rows = (body.rows ?? []) as Array<BatchRow | DisposalRow>;

  if (!mode || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "缺少 mode 或 rows" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: rows.length,
      failed: 0,
      errors: [],
      created: rows.map((_, i) => ({ id: `tmp-${i}` })),
    });
  }

  const admin = createAdminClient();

  let defaultStoreId = storeId;
  if (!defaultStoreId) {
    const { data: store } = await admin.from("stores").select("id").eq("is_active", true).limit(1).maybeSingle();
    defaultStoreId = store?.id;
  }
  if (!defaultStoreId) {
    return NextResponse.json({ error: "找不到可用門市，請先建立取貨點／門市" }, { status: 400 });
  }

  const errors: Array<{ row: number; message: string }> = [];
  const created: unknown[] = [];

  if (mode === "expiry") {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as BatchRow;
      let productId = row.product_id;
      if (!productId && row.barcode) {
        const { data: p } = await admin
          .from("products")
          .select("id")
          .or(`barcode.eq.${row.barcode},sku.eq.${row.barcode}`)
          .maybeSingle();
        productId = p?.id;
      }
      if (!productId) {
        errors.push({ row: i + 1, message: "找不到商品（請填 product_id 或有效條碼）" });
        continue;
      }
      const qty = Number(row.quantity ?? 0);
      if (!qty || qty <= 0) {
        errors.push({ row: i + 1, message: "數量必須大於 0" });
        continue;
      }
      const payload = {
        store_id: defaultStoreId,
        product_id: productId,
        supplier_id: row.supplier_id ?? null,
        batch_no: row.batch_no?.trim() || `B${Date.now()}-${i + 1}`,
        barcode: row.barcode ?? null,
        quantity: qty,
        remaining_quantity: qty,
        expiry_date: row.expiry_date || null,
        cost_price: row.cost_price ?? null,
        notes: row.notes ?? null,
        location: row.location ?? null,
        status: "active",
        created_by: auth!.profile.id,
        received_at: new Date().toISOString().slice(0, 10),
      };
      const { data, error: insertError } = await admin
        .from("store_batches")
        .insert(payload)
        .select()
        .single();
      if (insertError) {
        errors.push({ row: i + 1, message: insertError.message });
        continue;
      }
      created.push(data);
      await logAudit(auth!.profile.id, "create", "store_batches", data.id, null, data, request as never);

      await admin.from("store_inventory").upsert(
        {
          store_id: defaultStoreId,
          product_id: productId,
          quantity: qty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id,product_id" }
      );
    }
  } else {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as DisposalRow;
      if (!row.product_id) {
        errors.push({ row: i + 1, message: "缺少 product_id" });
        continue;
      }
      const qty = Number(row.quantity ?? 0);
      if (!qty || qty <= 0) {
        errors.push({ row: i + 1, message: "數量必須大於 0" });
        continue;
      }
      const unitCost = row.unit_cost != null ? Number(row.unit_cost) : null;
      const payload = {
        store_id: defaultStoreId,
        product_id: row.product_id,
        batch_id: row.batch_id ?? null,
        quantity: qty,
        reason: row.reason ?? null,
        unit_cost: unitCost,
        total_loss: unitCost != null ? unitCost * qty : null,
        status: "open",
        created_by: auth!.profile.id,
        disposed_at: new Date().toISOString(),
      };
      const { data, error: insertError } = await admin
        .from("store_disposals")
        .insert(payload)
        .select()
        .single();
      if (insertError) {
        errors.push({ row: i + 1, message: insertError.message });
        continue;
      }
      created.push(data);
      await logAudit(auth!.profile.id, "create", "store_disposals", data.id, null, data, request as never);
    }
  }

  return NextResponse.json({
    success: created.length,
    failed: errors.length,
    errors,
    created,
  });
}
