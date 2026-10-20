import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanWriteStore } from "@/lib/admin/store-access";
import { applyStocktake } from "@/lib/admin/stocktake";

export const dynamic = "force-dynamic";

/**
 * 套用盤點：把清點到的數量寫成實際庫存。
 *
 * 這是整個流程唯一會改動庫存的地方，所以：
 *   - 已經套用過的單會被擋下（409），避免重複套用
 *   - 每一筆都會寫 inventory_movements，查得到是誰在什麼時候改了多少
 *   - 寫 audit log
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      result: { applied: 0, skipped: 0, productsResynced: 0, errors: [] },
    });
  }

  const admin = createAdminClient();
  const { data: stocktake } = await admin
    .from("store_stocktakes")
    .select("id, store_id, status, title")
    .eq("id", id)
    .maybeSingle();

  if (!stocktake) {
    return NextResponse.json({ error: "找不到盤點單" }, { status: 404 });
  }
  if (stocktake.status === "completed") {
    return NextResponse.json(
      { error: "這張盤點單已經套用過了。如要再次調整，請建立新的盤點單。" },
      { status: 409 }
    );
  }
  if (stocktake.status === "cancelled") {
    return NextResponse.json({ error: "這張盤點單已取消" }, { status: 409 });
  }

  const guard = await assertCanWriteStore(auth!, stocktake.store_id);
  if (!guard.ok) return guard.response;

  const result = await applyStocktake({
    stocktakeId: id,
    storeId: String(stocktake.store_id),
    userId: auth!.profile.id,
  });

  await logAudit(
    auth!.profile.id,
    "update",
    "store_stocktakes",
    id,
    { status: stocktake.status },
    { status: "completed", ...result },
    request as never
  );

  return NextResponse.json({ result });
}
