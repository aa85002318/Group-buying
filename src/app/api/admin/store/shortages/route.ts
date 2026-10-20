import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveOpsStoreId } from "@/lib/admin/store-access";
import { fetchAllSupabaseRows } from "@/lib/supabase/fetch-all";

export const dynamic = "force-dynamic";

/**
 * 「上架中但這間門市沒貨」的清單。
 *
 * 用途：盤點完之後一眼看出哪些商品網站上還在賣、架上卻沒有了，
 * 可以直接送進門市協作區的缺貨通知流程。
 *
 * 判斷標準：
 *   - 商品是上架中（is_active）
 *   - 這間門市的 store_inventory 數量 <= 門檻（預設 0，可帶 threshold）
 *   - 從來沒建過 store_inventory 那一格的，也算缺貨（代表這間門市沒進過這個商品）
 *
 * 只看盤點過的數字有意義，所以回傳會標出每一筆的 counted_at，
 * 沒盤過的會是 null，讓門市知道那個數字還不可靠。
 */
export async function GET(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const threshold = Number(searchParams.get("threshold") ?? 0);
  const onlyCounted = searchParams.get("only_counted") === "1";
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? 200)));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ store_id: null, shortages: [] });
  }

  const admin = createAdminClient();
  const storeId = await resolveOpsStoreId(auth!, searchParams.get("store_id"));
  if (!storeId) {
    return NextResponse.json({ error: "找不到可操作的門市" }, { status: 400 });
  }

  // 這間門市的庫存現況，一次撈完（門市商品數遠小於商品主檔）。
  const invResult = await fetchAllSupabaseRows<{
    product_id: string;
    quantity: number | null;
    counted_at: string | null;
    source: string | null;
  }>(async (from, to) => {
    const page = await admin
      .from("store_inventory")
      .select("product_id, quantity, counted_at, source")
      .eq("store_id", storeId)
      .range(from, to);
    return { data: page.data ?? null, error: page.error };
  });

  const invByProduct = new Map(
    (invResult.data ?? []).map((row) => [String(row.product_id), row])
  );

  // 上架中的商品。只取清單需要的欄位，不要整包 107 欄。
  const productsResult = await fetchAllSupabaseRows<{
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    image_url: string | null;
    unit: string | null;
    safety_stock: number | null;
  }>(async (from, to) => {
    const page = await admin
      .from("products")
      .select("id, name, sku, barcode, image_url, unit, safety_stock")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(from, to);
    return { data: page.data ?? null, error: page.error };
  });

  if (productsResult.error) {
    return NextResponse.json({ error: productsResult.error.message }, { status: 500 });
  }

  const shortages = [];
  for (const p of productsResult.data ?? []) {
    const inv = invByProduct.get(String(p.id));
    const counted = inv?.counted_at ?? null;

    // 只看盤過的：還沒盤點的商品數字不可靠，先不要吵門市人員。
    if (onlyCounted && !counted) continue;

    const qty = Number(inv?.quantity ?? 0);
    // 有設安全庫存就用它，否則用傳進來的門檻。
    const limitQty = p.safety_stock != null && p.safety_stock > 0 ? Number(p.safety_stock) : threshold;
    if (qty > limitQty) continue;

    shortages.push({
      product_id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      image_url: p.image_url,
      unit: p.unit,
      quantity: qty,
      threshold: limitQty,
      counted_at: counted,
      never_counted: !counted,
      never_stocked: !inv,
    });
    if (shortages.length >= limit) break;
  }

  return NextResponse.json({ store_id: storeId, threshold, shortages });
}
