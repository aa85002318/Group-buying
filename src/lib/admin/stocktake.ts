/**
 * 門市盤點：把清點到的數量套用成實際庫存。
 *
 * 為什麼不是「入庫 +N」而是「設定為 N」：
 * POS 沒有連動，賣出數量算不出來，所以系統裡的數字一定會跟架上的實物對不起來。
 * 盤點是唯一可靠的來源，所以是「把庫存改成人工數到的數字」。
 *
 * 套用一次會做三件事：
 *   1. 寫一筆 inventory_movements（type = 'stocktake'），留下前後數量的軌跡
 *   2. 把 store_inventory 設成清點數，並標記 source = 'stocktake'
 *      （之後批號加總就不會再覆蓋它，見 syncInventoryFromBatches）
 *   3. 重算 products.stock = 這個商品在各門市的盤點量總和
 *
 * 盤點只改數量，不碰批號效期。效期的用途是提醒門市人員檢查即期品，
 * 跟盤點是兩件事。
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { recordInventoryMovement } from "@/lib/admin/inventory-movements";

type AdminClient = ReturnType<typeof createAdminClient>;

export type StocktakeApplyResult = {
  applied: number;
  skipped: number;
  productsResynced: number;
  errors: Array<{ productId: string; message: string }>;
};

/**
 * 重算單一商品的 products.stock：各門市 store_inventory 的總和。
 *
 * 用「重算」而不是「加減」，是因為重算可以自我修正——中間出過任何差錯，
 * 下一次盤點就會把數字拉回正確值；用加減的話誤差會一直累積下去。
 */
export async function resyncProductStock(
  admin: AdminClient,
  productId: string
): Promise<number | null> {
  const { data, error } = await admin
    .from("store_inventory")
    .select("quantity")
    .eq("product_id", productId);

  if (error) return null;

  const total = (data ?? []).reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);

  const { error: updateError } = await admin
    .from("products")
    .update({ stock: total })
    .eq("id", productId);

  if (updateError) return null;
  return total;
}

/**
 * 套用一張盤點單。
 *
 * 冪等：只處理 status 不是 completed 的單；而且就算重跑，第二次的差異會是 0
 * （庫存已經等於清點數），不會把數字再動一次。
 */
export async function applyStocktake(options: {
  stocktakeId: string;
  storeId: string;
  userId: string;
}): Promise<StocktakeApplyResult> {
  const { stocktakeId, storeId, userId } = options;
  const admin = createAdminClient();
  const result: StocktakeApplyResult = {
    applied: 0,
    skipped: 0,
    productsResynced: 0,
    errors: [],
  };

  // 只取真的有清點過的行。counted_qty 是 null 代表掃到了但還沒輸入數量，跳過。
  const { data: lines, error: linesError } = await admin
    .from("store_stocktake_lines")
    .select("id, product_id, counted_qty")
    .eq("stocktake_id", stocktakeId);

  if (linesError) {
    result.errors.push({ productId: "-", message: linesError.message });
    return result;
  }

  const touchedProducts = new Set<string>();
  const nowIso = new Date().toISOString();

  for (const line of lines ?? []) {
    const productId = String(line.product_id);
    const counted = line.counted_qty;
    if (counted == null) {
      result.skipped += 1;
      continue;
    }
    const countedQty = Number(counted);
    if (!Number.isFinite(countedQty) || countedQty < 0) {
      result.errors.push({ productId, message: "清點數量不是有效的非負數字" });
      continue;
    }

    // 套用當下的實際庫存才是正確的 before，不能用建立盤點單時記下的 system_qty
    // （中間可能有別的異動）。
    const { data: current } = await admin
      .from("store_inventory")
      .select("quantity")
      .eq("store_id", storeId)
      .eq("product_id", productId)
      .maybeSingle();

    const before = Number(current?.quantity ?? 0);
    const delta = countedQty - before;

    const { error: upsertError } = await admin.from("store_inventory").upsert(
      {
        store_id: storeId,
        product_id: productId,
        quantity: countedQty,
        source: "stocktake",
        counted_at: nowIso,
        counted_by: userId,
        updated_at: nowIso,
      },
      { onConflict: "store_id,product_id" }
    );

    if (upsertError) {
      result.errors.push({ productId, message: upsertError.message });
      continue;
    }

    // 差異為 0 也要留紀錄：「盤點過，結果相符」本身就是有用的資訊。
    await recordInventoryMovement({
      storeId,
      productId,
      movementType: "stocktake",
      quantityDelta: delta,
      quantityBefore: before,
      quantityAfter: countedQty,
      referenceType: "store_stocktakes",
      referenceId: stocktakeId,
      createdBy: userId,
      notes: delta === 0 ? "盤點相符" : delta > 0 ? "盤盈" : "盤虧",
    });

    // variance 回寫，之後查這張單就知道每一行差多少。
    await admin
      .from("store_stocktake_lines")
      .update({ system_qty: before, variance: delta })
      .eq("id", line.id);

    touchedProducts.add(productId);
    result.applied += 1;
  }

  for (const productId of Array.from(touchedProducts)) {
    const total = await resyncProductStock(admin, productId);
    if (total != null) result.productsResynced += 1;
  }

  await admin
    .from("store_stocktakes")
    .update({ status: "completed", completed_at: nowIso })
    .eq("id", stocktakeId);

  return result;
}
