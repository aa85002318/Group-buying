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
        "anomaly_type, description, quantity, status, reported_at, batch_id, assignee_name, products(name, sku, barcode)"
      )
      .neq("anomaly_type", "repair")
      .order("reported_at", { ascending: false })
      .limit(1000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data, error: qErr } = await q;
    // Soft-fail if assignee_name column missing
    let rowsRaw: Array<Record<string, unknown>> = (data as Array<Record<string, unknown>> | null) ?? [];
    if (qErr && /assignee_name/i.test(qErr.message)) {
      let q2 = admin
        .from("store_anomalies")
        .select(
          "anomaly_type, description, quantity, status, reported_at, batch_id, products(name, sku, barcode)"
        )
        .neq("anomaly_type", "repair")
        .order("reported_at", { ascending: false })
        .limit(1000);
      if (storeId) q2 = q2.eq("store_id", storeId);
      const retry = await q2;
      rowsRaw = (retry.data as Array<Record<string, unknown>> | null) ?? [];
    }
    rows = rowsRaw.map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      return {
        商品名稱: p?.name ?? "",
        SKU: p?.sku ?? "",
        條碼: p?.barcode ?? "",
        批次ID: (r.batch_id as string | null) ?? "",
        異常類型: (r.anomaly_type as string | null) ?? "",
        數量: r.quantity ?? "",
        原因: (r.description as string | null) ?? "",
        負責人: (r.assignee_name as string | null) ?? "",
        狀態: (r.status as string | null) ?? "",
        回報時間: (r.reported_at as string | null) ?? "",
      };
    });
  } else if (type === "repair") {
    let q = admin
      .from("store_anomalies")
      .select(
        "anomaly_type, description, quantity, status, reported_at, urgency, assignee_name, customer_name, customer_phone, vendor_name, products(name, sku, barcode)"
      )
      .eq("anomaly_type", "repair")
      .order("reported_at", { ascending: false })
      .limit(1000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data, error: qErr } = await q;
    let rowsRaw: Array<Record<string, unknown>> = (data as Array<Record<string, unknown>> | null) ?? [];
    if (qErr && /urgency|assignee_name|customer_name|vendor_name/i.test(qErr.message)) {
      let q2 = admin
        .from("store_anomalies")
        .select(
          "anomaly_type, description, quantity, status, reported_at, products(name, sku, barcode)"
        )
        .eq("anomaly_type", "repair")
        .order("reported_at", { ascending: false })
        .limit(1000);
      if (storeId) q2 = q2.eq("store_id", storeId);
      const retry = await q2;
      rowsRaw = (retry.data as Array<Record<string, unknown>> | null) ?? [];
    }
    rows = rowsRaw.map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      return {
        商品名稱: p?.name ?? "",
        SKU: p?.sku ?? "",
        條碼: p?.barcode ?? "",
        數量: r.quantity ?? "",
        故障說明: (r.description as string | null) ?? "",
        緊急程度: (r.urgency as string | null) ?? "",
        客戶姓名: (r.customer_name as string | null) ?? "",
        電話: (r.customer_phone as string | null) ?? "",
        廠商: (r.vendor_name as string | null) ?? "",
        負責人: (r.assignee_name as string | null) ?? "",
        狀態: (r.status as string | null) ?? "",
        回報時間: (r.reported_at as string | null) ?? "",
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
  } else if (type === "customer_orders" || type === "price_inquiries") {
    const requestType = type === "customer_orders" ? "order" : "price_inquiry";
    let q = admin
      .from("store_customer_requests")
      .select(
        "customer_name, customer_phone, customer_source, barcode, quantity, expected_arrival_date, inquiry_body, needs_reply, note, assigned_to_name, status, created_at, follow_up_at, products(name, sku, barcode)"
      )
      .eq("request_type", requestType)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => {
      const p = r.products as { name?: string; sku?: string; barcode?: string } | null;
      if (requestType === "order") {
        return {
          姓名: r.customer_name ?? "",
          電話: r.customer_phone ?? "",
          客戶來源: r.customer_source ?? "",
          條碼: r.barcode ?? p?.barcode ?? "",
          商品名稱: p?.name ?? "",
          數量: r.quantity ?? "",
          希望到貨日: r.expected_arrival_date ?? "",
          負責人: r.assigned_to_name ?? "",
          備註: r.note ?? "",
          狀態: r.status ?? "",
          建立時間: r.created_at ?? "",
        };
      }
      return {
        姓名: r.customer_name ?? "",
        電話: r.customer_phone ?? "",
        條碼: r.barcode ?? p?.barcode ?? "",
        商品名稱: p?.name ?? "",
        預估訂購量: r.quantity ?? "",
        詢問內容: r.inquiry_body ?? "",
        需正式報價: r.needs_reply ? "是" : "否",
        預計回覆日: r.follow_up_at ?? "",
        負責人: r.assigned_to_name ?? "",
        備註: r.note ?? "",
        狀態: r.status ?? "",
        建立時間: r.created_at ?? "",
      };
    });
  } else if (type === "worklogs") {
    let q = admin
      .from("store_work_logs")
      .select("log_date, body, author_name, created_at")
      .order("log_date", { ascending: false })
      .limit(500);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => ({
      日期: r.log_date ?? "",
      內容: r.body ?? "",
      填寫人: r.author_name ?? "",
      建立時間: r.created_at ?? "",
    }));
  } else if (type === "todos") {
    let q = admin
      .from("store_todos")
      .select("todo_date, label, is_done, done_at, created_at")
      .order("todo_date", { ascending: false })
      .limit(500);
    if (storeId) q = q.eq("store_id", storeId);
    const { data } = await q;
    rows = (data ?? []).map((r) => ({
      日期: r.todo_date ?? "",
      待辦內容: r.label ?? "",
      是否完成: r.is_done ? "是" : "否",
      完成時間: r.done_at ?? "",
      建立時間: r.created_at ?? "",
    }));
  }

  const out = sheetFromRows(rows, "匯出");
  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": encodeContentDisposition(`${def.fileStem}.xlsx`),
    },
  });
}
