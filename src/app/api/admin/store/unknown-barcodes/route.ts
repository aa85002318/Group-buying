import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanWriteStore, resolveOpsStoreId } from "@/lib/admin/store-access";

export const dynamic = "force-dynamic";

/**
 * 掃到系統查不到的條碼時收在這裡。
 *
 * 設計重點：掃碼當下不要中斷門市人員。查不到就先收下來，繼續掃下一個，
 * 事後再回來把這些條碼綁定到正確的商品。
 *
 * GET    列出待處理
 * POST   收下一個掃不到的條碼（同門市同條碼重複掃只會累加次數）
 * PATCH  綁定到商品，並把條碼寫回商品主檔，下次就掃得到了
 */

export async function GET(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) return NextResponse.json({ items: [] });

  const { searchParams } = new URL(request.url);
  const admin = createAdminClient();
  const storeId = await resolveOpsStoreId(auth!, searchParams.get("store_id"));
  if (!storeId) return NextResponse.json({ error: "找不到可操作的門市" }, { status: 400 });

  const { data, error: fetchError } = await admin
    .from("store_unknown_barcodes")
    .select("*")
    .eq("store_id", storeId)
    .eq("status", searchParams.get("status") ?? "pending")
    .order("created_at", { ascending: false })
    .limit(200);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ store_id: storeId, items: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  let body: { barcode?: string; store_id?: string; counted_qty?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const barcode = String(body.barcode ?? "").trim();
  if (!barcode) return NextResponse.json({ error: "缺少條碼" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const storeId = await resolveOpsStoreId(auth!, body.store_id);
  const guard = await assertCanWriteStore(auth!, storeId);
  if (!guard.ok) return guard.response;

  const { data: existing } = await admin
    .from("store_unknown_barcodes")
    .select("id, scanned_count")
    .eq("store_id", storeId!)
    .eq("barcode", barcode)
    .maybeSingle();

  if (existing) {
    await admin
      .from("store_unknown_barcodes")
      .update({
        scanned_count: Number(existing.scanned_count ?? 0) + 1,
        counted_qty: body.counted_qty ?? null,
        status: "pending",
      })
      .eq("id", existing.id);
    return NextResponse.json({ ok: true, id: existing.id, repeated: true });
  }

  const { data, error: insertError } = await admin
    .from("store_unknown_barcodes")
    .insert({
      store_id: storeId!,
      barcode,
      counted_qty: body.counted_qty ?? null,
      created_by: auth!.profile.id,
    })
    .select("id")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, repeated: false });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  let body: { id?: string; product_id?: string; action?: "resolve" | "ignore"; write_back?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少項目" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("store_unknown_barcodes")
    .select("id, store_id, barcode")
    .eq("id", id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "找不到這筆待處理條碼" }, { status: 404 });

  const guard = await assertCanWriteStore(auth!, row.store_id);
  if (!guard.ok) return guard.response;

  if (body.action === "ignore") {
    await admin.from("store_unknown_barcodes").update({ status: "ignored" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  const productId = String(body.product_id ?? "").trim();
  if (!productId) return NextResponse.json({ error: "請選擇要綁定的商品" }, { status: 400 });

  // 把條碼寫回商品主檔，下次就掃得到。只在該商品還沒有條碼時寫，
  // 不覆蓋既有的條碼——那可能是正確的，這顆才是副條碼。
  let wroteBack = false;
  if (body.write_back !== false) {
    const { data: product } = await admin
      .from("products")
      .select("id, barcode")
      .eq("id", productId)
      .maybeSingle();
    if (product && !String(product.barcode ?? "").trim()) {
      const { error: updateError } = await admin
        .from("products")
        .update({ barcode: row.barcode })
        .eq("id", productId);
      wroteBack = !updateError;
    }
  }

  await admin
    .from("store_unknown_barcodes")
    .update({
      status: "resolved",
      resolved_product_id: productId,
      resolved_at: new Date().toISOString(),
      resolved_by: auth!.profile.id,
    })
    .eq("id", id);

  return NextResponse.json({ ok: true, wrote_back: wroteBack });
}
