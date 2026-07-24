import { createAdminClient } from "@/lib/supabase/admin";
import type { MovementType } from "@/lib/admin/store-ops";

type MovementInput = {
  storeId: string;
  productId: string;
  batchId?: string | null;
  movementType: MovementType;
  quantityDelta: number;
  quantityBefore?: number | null;
  quantityAfter?: number | null;
  unitCost?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

/** Best-effort write; never throws to caller — logs on failure. */
export async function recordInventoryMovement(input: MovementInput) {
  try {
    const admin = createAdminClient();
    await admin.from("inventory_movements").insert({
      store_id: input.storeId,
      product_id: input.productId,
      batch_id: input.batchId ?? null,
      movement_type: input.movementType,
      quantity_delta: input.quantityDelta,
      quantity_before: input.quantityBefore ?? null,
      quantity_after: input.quantityAfter ?? null,
      unit_cost: input.unitCost ?? null,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
    });
  } catch (e) {
    console.error("[inventory_movements]", e);
  }
}

/** Recompute store_inventory row as sum of active batch remaining_quantity */
export async function syncInventoryFromBatches(storeId: string, productId: string) {
  try {
    const admin = createAdminClient();
    const { data: batches } = await admin
      .from("store_batches")
      .select("remaining_quantity, quantity, status")
      .eq("store_id", storeId)
      .eq("product_id", productId)
      .eq("status", "active");

    const total = (batches ?? []).reduce(
      (s, b) => s + Number(b.remaining_quantity ?? b.quantity ?? 0),
      0
    );

    await admin.from("store_inventory").upsert(
      {
        store_id: storeId,
        product_id: productId,
        quantity: total,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id,product_id" }
    );
  } catch (e) {
    console.error("[syncInventoryFromBatches]", e);
  }
}
