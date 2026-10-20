import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanWriteStore } from "@/lib/admin/store-access";

export const dynamic = "force-dynamic";

/**
 * 盤點單的明細。
 *
 * GET  讀回目前已清點的行（手機中途離開後要能接著做）
 * POST 批次寫入／更新清點數量
 *
 * 盤點的語意是「設定為」不是「累加」，所以同一個商品重複送出只會覆蓋成最後
 * 一次的數量。這同時也讓這支天然冪等——手機訊號不穩重送同一批，結果一樣。
 */

type IncomingLine = {
  product_id?: string;
  counted_qty?: number | string | null;
  notes?: string | null;
};

async function loadStocktake(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data } = await admin
    .from("store_stocktakes")
    .select("id, store_id, status")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ lines: [] });
  }

  const admin = createAdminClient();
  const stocktake = await loadStocktake(admin, id);
  if (!stocktake) {
    return NextResponse.json({ error: "找不到盤點單" }, { status: 404 });
  }

  const guard = await assertCanWriteStore(auth!, stocktake.store_id);
  if (!guard.ok) return guard.response;

  const { data, error: fetchError } = await admin
    .from("store_stocktake_lines")
    .select("id, product_id, system_qty, counted_qty, variance, notes, products(name, sku, barcode, image_url, unit)")
    .eq("stocktake_id", id)
    .order("created_at", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ stocktake, lines: data ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;
  const { id } = await params;

  let body: { lines?: IncomingLine[] };
  try {
    body = (await request.json()) as { lines?: IncomingLine[] };
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const incoming = Array.isArray(body.lines) ? body.lines : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "沒有要儲存的項目" }, { status: 400 });
  }
  if (incoming.length > 500) {
    return NextResponse.json({ error: "一次最多儲存 500 筆，請分批送出" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ saved: incoming.length, errors: [] });
  }

  const admin = createAdminClient();
  const stocktake = await loadStocktake(admin, id);
  if (!stocktake) {
    return NextResponse.json({ error: "找不到盤點單" }, { status: 404 });
  }
  if (stocktake.status === "completed") {
    return NextResponse.json(
      { error: "這張盤點單已經套用過了，不能再修改。請建立新的盤點單。" },
      { status: 409 }
    );
  }

  const guard = await assertCanWriteStore(auth!, stocktake.store_id);
  if (!guard.ok) return guard.response;

  const errors: Array<{ product_id: string; message: string }> = [];
  let saved = 0;

  for (const line of incoming) {
    const productId = String(line.product_id ?? "").trim();
    if (!productId) {
      errors.push({ product_id: "-", message: "缺少商品" });
      continue;
    }
    const qty = line.counted_qty == null ? null : Number(line.counted_qty);
    if (qty != null && (!Number.isFinite(qty) || qty < 0)) {
      errors.push({ product_id: productId, message: "數量必須是 0 或正數" });
      continue;
    }

    // 盤點當下的系統數量，只在第一次建立這一行時記錄，之後不覆蓋——
    // 它代表「開始盤這個商品時系統以為有多少」。
    const { data: existing } = await admin
      .from("store_stocktake_lines")
      .select("id, system_qty")
      .eq("stocktake_id", id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await admin
        .from("store_stocktake_lines")
        .update({
          counted_qty: qty,
          variance: qty == null ? null : qty - Number(existing.system_qty ?? 0),
          notes: line.notes ?? null,
        })
        .eq("id", existing.id);
      if (updateError) {
        errors.push({ product_id: productId, message: updateError.message });
        continue;
      }
      saved += 1;
      continue;
    }

    const { data: inv } = await admin
      .from("store_inventory")
      .select("quantity")
      .eq("store_id", stocktake.store_id)
      .eq("product_id", productId)
      .maybeSingle();
    const systemQty = Number(inv?.quantity ?? 0);

    const { error: insertError } = await admin.from("store_stocktake_lines").insert({
      stocktake_id: id,
      product_id: productId,
      system_qty: systemQty,
      counted_qty: qty,
      variance: qty == null ? null : qty - systemQty,
      notes: line.notes ?? null,
    });

    if (insertError) {
      errors.push({ product_id: productId, message: insertError.message });
      continue;
    }
    saved += 1;
  }

  if (stocktake.status === "draft" && saved > 0) {
    await admin.from("store_stocktakes").update({ status: "in_progress" }).eq("id", id);
  }

  return NextResponse.json({ saved, errors });
}
