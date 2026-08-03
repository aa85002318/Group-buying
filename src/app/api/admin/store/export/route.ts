import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  encodeContentDisposition,
  STORE_EXCEL_EXPORTS,
  type StoreExcelExportType,
} from "@/lib/admin/store-excel";

function normalizeType(raw: string | null): StoreExcelExportType {
  const hit = STORE_EXCEL_EXPORTS.find((e) => e.id === raw);
  return hit?.id ?? "inventory";
}

function sheetFromRows(rows: Record<string, unknown>[], sheetName: string) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 提示: "目前沒有資料" }]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const type = normalizeType(new URL(request.url).searchParams.get("type"));
  const def = STORE_EXCEL_EXPORTS.find((e) => e.id === type)!;

  if (!isSupabaseConfigured()) {
    const out = sheetFromRows([], "匯出");
    return new NextResponse(Buffer.from(out), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDisposition(`${def.fileStem}.xlsx`),
      },
    });
  }

  const admin = createAdminClient();
  const { data: store } = await admin.from("stores").select("id").eq("is_active", true).limit(1).maybeSingle();
  const storeId = store?.id;

  let rows: Record<string, unknown>[] = [];

  if (type === "inventory") {
    let q = admin
      .from("store_inventory")
      .select("quantity, updated_at, products(name, sku, barcode, unit)")
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string; unit?: string } | null;
      return {
        商品名稱: p?.name ?? "",
        SKU: p?.sku ?? "",
        條碼: p?.barcode ?? "",
        單位: p?.unit ?? "",
        庫存數量: r.quantity ?? 0,
        更新時間: r.updated_at ?? "",
      };
    });
  } else if (type === "expiry") {
    let q = admin
      .from("store_batches")
      .select(
        "batch_no, barcode, quantity, remaining_quantity, expiry_date, location, status, received_at, products(name, sku, barcode)"
      )
      .order("expiry_date", { ascending: true, nullsFirst: false })
      .limit(2000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      return {
        商品名稱: p?.name ?? "",
        SKU: p?.sku ?? "",
        條碼: r.barcode ?? p?.barcode ?? "",
        批號: r.batch_no ?? "",
        到期日: r.expiry_date ?? "",
        進貨量: r.quantity ?? 0,
        剩餘量: r.remaining_quantity ?? r.quantity ?? 0,
        儲位: r.location ?? "",
        狀態: r.status ?? "",
        進貨日: r.received_at ?? "",
      };
    });
  } else if (type === "price") {
    const { data } = await admin
      .from("products")
      .select("name, sku, barcode, price, cost_price, safety_stock, stock, status")
      .order("name")
      .limit(3000);
    rows = (data ?? []).map((p) => ({
      商品名稱: p.name ?? "",
      SKU: p.sku ?? "",
      條碼: p.barcode ?? "",
      售價: p.price ?? "",
      成本: p.cost_price ?? "",
      安全庫存: p.safety_stock ?? "",
      現貨: p.stock ?? "",
      狀態: p.status ?? "",
    }));
  } else if (type === "anomaly") {
    let q = admin
      .from("store_anomalies")
      .select(
        "anomaly_type, description, quantity, status, reported_at, batch_id, products(name, sku, barcode)"
      )
      .order("reported_at", { ascending: false })
      .limit(1000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      return {
        商品名稱: p?.name ?? "",
        SKU: p?.sku ?? "",
        條碼: p?.barcode ?? "",
        批次ID: r.batch_id ?? "",
        異常類型: r.anomaly_type ?? "",
        數量: r.quantity ?? "",
        原因: r.description ?? "",
        狀態: r.status ?? "",
        回報時間: r.reported_at ?? "",
      };
    });
  } else if (type === "disposal") {
    let q = admin
      .from("store_disposals")
      .select(
        "quantity, reason, unit_cost, total_loss, status, disposed_at, batch_id, products(name, sku, barcode)"
      )
      .order("disposed_at", { ascending: false })
      .limit(1000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      return {
        商品名稱: p?.name ?? "",
        SKU: p?.sku ?? "",
        條碼: p?.barcode ?? "",
        批次ID: r.batch_id ?? "",
        數量: r.quantity ?? "",
        原因: r.reason ?? "",
        成本: r.unit_cost ?? "",
        損失金額: r.total_loss ?? "",
        狀態: r.status ?? "",
        報廢時間: r.disposed_at ?? "",
      };
    });
  } else if (type === "return") {
    let q = admin
      .from("store_returns")
      .select(
        "quantity, reason, status, returned_at, batch_id, products(name, sku, barcode)"
      )
      .order("returned_at", { ascending: false })
      .limit(1000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      return {
        商品名稱: p?.name ?? "",
        SKU: p?.sku ?? "",
        條碼: p?.barcode ?? "",
        批次ID: r.batch_id ?? "",
        數量: r.quantity ?? "",
        原因: r.reason ?? "",
        狀態: r.status ?? "",
        退貨時間: r.returned_at ?? "",
      };
    });
  } else if (type === "requests") {
    let q = admin
      .from("store_requests")
      .select(
        "quantity, note, status, created_at, reviewed_at, products(name, sku, barcode)"
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      return {
        商品名稱: p?.name ?? "（未指定）",
        SKU: p?.sku ?? "",
        條碼: p?.barcode ?? "",
        數量: r.quantity ?? "",
        備註: r.note ?? "",
        狀態: r.status ?? "",
        建立時間: r.created_at ?? "",
        審核時間: r.reviewed_at ?? "",
      };
    });
  }

  const out = sheetFromRows(rows, "匯出");
  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": encodeContentDisposition(`${def.fileStem}.xlsx`),
    },
  });
}
