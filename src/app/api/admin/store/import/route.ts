import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  encodeContentDisposition,
  getStoreExcelTemplate,
  isStoreExcelImportType,
  type StoreExcelImportType,
} from "@/lib/admin/store-excel";
import {
  recordInventoryMovement,
  syncInventoryFromBatches,
} from "@/lib/admin/inventory-movements";
import { assertCanWriteStore, resolveOpsStoreId } from "@/lib/admin/store-access";

type AdminClient = ReturnType<typeof createAdminClient>;

type PreviewRow = {
  row: number;
  barcode?: string;
  sku?: string;
  product_name?: string;
  product_id?: string | null;
  batch_id?: string | null;
  batch_no?: string;
  supplier_name?: string;
  category_name?: string;
  quantity?: number;
  expiry_date?: string;
  reason?: string;
  unit_cost?: number;
  anomaly_type?: string;
  price?: number;
  cost_price?: number;
  safety_stock?: number;
  notes?: string;
  assignee_name?: string;
  urgency?: string;
  return_target?: string;
  expected_return_date?: string;
  customer_name?: string;
  customer_phone?: string;
  vendor_name?: string;
  errors: string[];
  will_create_supplier?: boolean;
  will_create_category?: boolean;
};

const JOB_TYPES = new Set([
  "expiry",
  "disposal",
  "products",
  "batches",
  "return",
  "anomaly",
  "inventory",
  "price",
]);

const NEW_FIELD_RE =
  /pause_sales|assignee_name|urgency|affects_operations|manager_confirmed|disposal_reason|return_target|expected_return/i;

async function insertWithSoftFallback(
  admin: AdminClient,
  table: "store_anomalies" | "store_returns" | "store_disposals",
  payload: Record<string, unknown>,
  extraKeys: string[]
) {
  let result = await admin.from(table).insert(payload).select("id").single();
  if (result.error && NEW_FIELD_RE.test(result.error.message)) {
    const legacy = { ...payload };
    for (const key of extraKeys) delete legacy[key];
    result = await admin.from(table).insert(legacy).select("id").single();
  }
  return result;
}

function normalizeImportType(raw: string): StoreExcelImportType {
  if (raw === "batches") return "expiry";
  if (isStoreExcelImportType(raw)) return raw;
  return "expiry";
}

function jobImportType(t: StoreExcelImportType): string {
  if (t === "repair") return "anomaly";
  return JOB_TYPES.has(t) ? t : "expiry";
}

function mapUrgency(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return "normal";
  if (t.includes("緊") || t === "urgent") return "urgent";
  if (t.includes("高") || t === "high") return "high";
  if (t.includes("低") || t === "low") return "low";
  return "normal";
}

function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function num(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  const s = cell(row, ...keys);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function dateCell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      return v.toISOString().slice(0, 10);
    }
  }
  return cell(row, ...keys);
}

function parseWorkbook(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

function mapAnomalyType(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return "damaged";
  if (t.includes("修") || t === "repair") return "repair";
  if (t.includes("短") || t === "shortage") return "shortage";
  if (t.includes("效") || t.includes("期") || t === "expiry") return "expiry";
  if (t.includes("特殊") || t === "special") return "special";
  if (t.includes("損") || t.includes("壞") || t === "damaged") return "damaged";
  return raw.trim() || "damaged";
}

const PRODUCT_OPS = new Set<StoreExcelImportType>([
  "expiry",
  "disposal",
  "return",
  "inventory",
  "anomaly",
  "repair",
]);

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const type = normalizeImportType(new URL(request.url).searchParams.get("type") ?? "expiry");
  const tpl = getStoreExcelTemplate(type);
  const headers = tpl?.headers ?? ["條碼", "SKU", "商品名稱", "批號", "到期日", "數量"];
  const sample = tpl?.sample ?? [];
  const fileStem = tpl?.fileStem ?? `store-${type}-template`;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  XLSX.utils.book_append_sheet(wb, ws, "匯入");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;

  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": encodeContentDisposition(`${fileStem}.xlsx`),
    },
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const form = await request.formData();
  const file = form.get("file");
  const importType = normalizeImportType(String(form.get("import_type") ?? "expiry"));
  const confirm = String(form.get("confirm") ?? "") === "1";
  const jobId = form.get("job_id") ? String(form.get("job_id")) : null;
  const tpl = getStoreExcelTemplate(importType);

  if (!tpl?.supportsStoreImport) {
    return NextResponse.json(
      {
        error:
          importType === "products"
            ? "商品主檔匯入請使用商品匯入頁"
            : "此類型僅提供範本下載，請至對應頁面建立紀錄",
      },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請上傳 Excel 檔案" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const rawRows = parseWorkbook(buffer).slice(0, 500);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      preview: rawRows.map((r, i) => ({
        row: i + 2,
        barcode: cell(r, "barcode", "條碼"),
        quantity: Number(cell(r, "quantity", "數量") || 0),
        errors: [],
      })),
      summary: { total: rawRows.length, ok: rawRows.length, failed: 0 },
      job_id: null,
    });
  }

  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, sku, barcode, supplier_id, price, cost_price, safety_stock")
    .limit(5000);
  const productList = products ?? [];
  const byBarcode = new Map(productList.filter((p) => p.barcode).map((p) => [String(p.barcode), p]));
  const bySku = new Map(productList.filter((p) => p.sku).map((p) => [String(p.sku), p]));

  const { data: suppliers } = await admin.from("suppliers").select("id, name").limit(2000);
  const supplierByName = new Map(
    (suppliers ?? []).map((s) => [s.name.trim().toLowerCase(), s])
  );

  const { data: categories } = await admin.from("product_categories").select("id, name").limit(2000);
  const categoryByName = new Map(
    (categories ?? []).map((c) => [c.name.trim().toLowerCase(), c])
  );

  const preferredStore = form.get("store_id") ? String(form.get("store_id")) : null;
  const storeId = await resolveOpsStoreId(auth!, preferredStore);
  if (!storeId) {
    return NextResponse.json(
      { error: "找不到可用門市，或無權限匯入其他分店" },
      { status: 403 }
    );
  }
  const writeGate = await assertCanWriteStore(auth!, storeId);
  if (!writeGate.ok) return writeGate.response;

  const { data: batches } = storeId
    ? await admin
        .from("store_batches")
        .select("id, product_id, batch_no, barcode, remaining_quantity, quantity, status")
        .eq("store_id", storeId)
        .eq("status", "active")
        .limit(5000)
    : { data: [] as Array<{
        id: string;
        product_id: string;
        batch_no: string | null;
        barcode: string | null;
        remaining_quantity: number | null;
        quantity: number | null;
        status: string | null;
      }> };

  const batchList = batches ?? [];

  function findBatch(
    productId: string | null | undefined,
    batchNo: string,
    barcode: string
  ) {
    if (batchNo && productId) {
      const hit = batchList.find(
        (b) => b.product_id === productId && String(b.batch_no ?? "") === batchNo
      );
      if (hit) return hit;
    }
    if (batchNo) {
      const hit = batchList.find((b) => String(b.batch_no ?? "") === batchNo);
      if (hit) return hit;
    }
    if (barcode && productId) {
      const hit = batchList.find(
        (b) => b.product_id === productId && String(b.barcode ?? "") === barcode
      );
      if (hit) return hit;
    }
    return null;
  }

  const preview: PreviewRow[] = rawRows.map((r, i) => {
    const barcode = cell(r, "barcode", "條碼");
    const sku = cell(r, "sku", "SKU", "商品編號");
    const productName = cell(r, "product_name", "商品名稱", "name", "商品");
    const supplierName = cell(r, "supplier_name", "廠商", "供應商");
    const categoryName = cell(r, "category_name", "分類");
    const quantity = num(r, "quantity", "數量");
    const expiry_date = dateCell(r, "expiry_date", "效期", "到期日");
    const batch_no = cell(r, "batch_no", "批號");
    const reason = cell(r, "reason", "原因", "備註", "notes");
    const unit_cost = num(r, "unit_cost", "成本");
    const anomalyRaw = cell(r, "anomaly_type", "異常類型", "類型");
    const price = num(r, "price", "售價");
    const cost_price = num(r, "cost_price", "成本");
    const safety_stock = num(r, "safety_stock", "安全庫存");
    const notes = cell(r, "notes", "備註");
    const assignee_name = cell(r, "assignee_name", "負責人");
    const urgencyRaw = cell(r, "urgency", "緊急程度");
    const return_target = cell(r, "return_target", "退貨對象");
    const expected_return_date = dateCell(r, "expected_return_date", "預計退貨日");
    const customer_name = cell(r, "customer_name", "客戶姓名");
    const customer_phone = cell(r, "customer_phone", "電話");
    const vendor_name = cell(r, "vendor_name", "廠商");
    const fault = cell(r, "fault", "故障說明");

    const errors: string[] = [];
    let product =
      (barcode && byBarcode.get(barcode)) || (sku && bySku.get(sku)) || null;

    if (!product && productName) {
      product = productList.find((p) => p.name === productName) ?? null;
    }

    if (!product) {
      errors.push("找不到商品（請確認條碼／SKU）");
    }

    if (PRODUCT_OPS.has(importType) && (quantity == null || quantity <= 0)) {
      errors.push("數量無效");
    }
    if (importType === "expiry" && !expiry_date) errors.push("缺少效期");
    if ((importType === "return" || importType === "inventory") && !batch_no) {
      errors.push("缺少批號");
    }
    if (importType === "price" && price == null && cost_price == null && safety_stock == null) {
      errors.push("請至少填售價、成本或安全庫存其中一項");
    }
    if (importType === "repair" && !(fault || reason || notes)) {
      errors.push("缺少故障說明");
    }

    const batch =
      product && (batch_no || barcode)
        ? findBatch(product.id, batch_no, barcode)
        : null;

    if ((importType === "return" || importType === "inventory") && product && !batch) {
      errors.push("找不到對應批次");
    }
    if (
      (importType === "anomaly" || importType === "repair") &&
      batch_no &&
      product &&
      !batch
    ) {
      errors.push("找不到對應批次");
    }

    const will_create_supplier = Boolean(
      supplierName && !supplierByName.has(supplierName.toLowerCase())
    );
    const will_create_category = Boolean(
      categoryName && !categoryByName.has(categoryName.toLowerCase())
    );

    const resolvedReason =
      importType === "repair"
        ? fault || reason || notes || undefined
        : reason || notes || undefined;

    return {
      row: i + 2,
      barcode: barcode || undefined,
      sku: sku || undefined,
      product_name: product?.name || productName || undefined,
      product_id: product?.id ?? null,
      batch_id: batch?.id ?? null,
      batch_no: batch_no || undefined,
      supplier_name: supplierName || vendor_name || undefined,
      category_name: categoryName || undefined,
      quantity,
      expiry_date: expiry_date || undefined,
      reason: resolvedReason,
      unit_cost,
      anomaly_type:
        importType === "repair"
          ? "repair"
          : anomalyRaw
            ? mapAnomalyType(anomalyRaw)
            : undefined,
      price,
      cost_price,
      safety_stock,
      notes: notes || undefined,
      assignee_name: assignee_name || undefined,
      urgency: urgencyRaw ? mapUrgency(urgencyRaw) : undefined,
      return_target: return_target || undefined,
      expected_return_date: expected_return_date || undefined,
      customer_name: customer_name || undefined,
      customer_phone: customer_phone || undefined,
      vendor_name: vendor_name || undefined,
      errors,
      will_create_supplier,
      will_create_category,
    };
  });

  const ok = preview.filter((p) => p.errors.length === 0).length;
  const failed = preview.length - ok;

  if (!confirm) {
    const { data: job } = await admin
      .from("store_import_jobs")
      .insert({
        import_type: jobImportType(importType),
        file_name: file.name,
        total_rows: preview.length,
        success_count: ok,
        failure_count: failed,
        created_by: auth!.profile.id,
        error_report: preview.filter((p) => p.errors.length),
        preview_snapshot: preview,
        status: "preview",
      })
      .select("id")
      .single();

    return NextResponse.json({
      job_id: job?.id ?? null,
      preview,
      summary: {
        total: preview.length,
        ok,
        failed,
        missing_barcode: preview.filter((p) => !p.product_id).length,
        new_suppliers: preview.filter((p) => p.will_create_supplier).length,
        new_categories: preview.filter((p) => p.will_create_category).length,
      },
    });
  }

  if (!storeId) {
    return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });
  }

  let resolvedJobId = jobId;
  if (!resolvedJobId) {
    const { data: job } = await admin
      .from("store_import_jobs")
      .insert({
        import_type: jobImportType(importType),
        file_name: file.name,
        total_rows: preview.length,
        created_by: auth!.profile.id,
        preview_snapshot: preview,
        status: "preview",
      })
      .select("id")
      .single();
    resolvedJobId = job?.id ?? null;
  }

  let successCount = 0;
  const commitErrors: Array<{ row: number; message: string }> = [];

  for (const row of preview) {
    if (row.errors.length || !row.product_id) {
      commitErrors.push({ row: row.row, message: row.errors.join("；") || "略過" });
      continue;
    }

    try {
      if (importType === "price") {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (row.price != null) patch.price = row.price;
        if (row.cost_price != null) patch.cost_price = row.cost_price;
        if (row.safety_stock != null) patch.safety_stock = row.safety_stock;
        const { error: updErr } = await admin.from("products").update(patch).eq("id", row.product_id);
        if (updErr) throw new Error(updErr.message);
        successCount += 1;
        await logAudit(auth!.profile.id, "import", "products", row.product_id, null, row, request as never);
        continue;
      }

      if (importType === "inventory") {
        if (!row.batch_id || row.quantity == null) throw new Error("缺少批次或數量");
        const before = batchList.find((b) => b.id === row.batch_id);
        const beforeQty = Number(before?.remaining_quantity ?? before?.quantity ?? 0);
        const { error: updErr } = await admin
          .from("store_batches")
          .update({
            remaining_quantity: row.quantity,
            quantity: Math.max(Number(before?.quantity ?? 0), row.quantity),
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.batch_id);
        if (updErr) throw new Error(updErr.message);
        await recordInventoryMovement({
          storeId,
          productId: row.product_id,
          batchId: row.batch_id,
          movementType: "adjust",
          quantityDelta: row.quantity - beforeQty,
          quantityBefore: beforeQty,
          quantityAfter: row.quantity,
          referenceType: "store_import",
          referenceId: resolvedJobId,
          notes: row.notes ?? row.reason ?? "Excel 庫存更新",
          createdBy: auth!.profile.id,
        });
        await syncInventoryFromBatches(storeId, row.product_id);
        successCount += 1;
        await logAudit(auth!.profile.id, "import", "store_batches", row.batch_id, null, row, request as never);
        continue;
      }

      let supplierId: string | null = null;
      if (row.supplier_name) {
        const existing = supplierByName.get(row.supplier_name.toLowerCase());
        if (existing) supplierId = existing.id;
        else {
          const { data: created } = await admin
            .from("suppliers")
            .insert({ name: row.supplier_name, is_active: true })
            .select("id, name")
            .single();
          if (created) {
            supplierId = created.id;
            supplierByName.set(created.name.toLowerCase(), created);
          }
        }
      }

      if (row.category_name && !categoryByName.has(row.category_name.toLowerCase())) {
        const { data: createdCat } = await admin
          .from("product_categories")
          .insert({ name: row.category_name, slug: `import-${Date.now()}-${row.row}` })
          .select("id, name")
          .single();
        if (createdCat) categoryByName.set(createdCat.name.toLowerCase(), createdCat);
      }

      if (importType === "disposal") {
        let batchId = row.batch_id;
        if (!batchId && row.batch_no) {
          const hit = findBatch(row.product_id, row.batch_no, row.barcode ?? "");
          batchId = hit?.id ?? null;
        }
        const payload: Record<string, unknown> = {
          store_id: storeId,
          product_id: row.product_id,
          batch_id: batchId,
          quantity: row.quantity,
          reason: row.reason ?? null,
          unit_cost: row.unit_cost ?? null,
          total_loss:
            row.unit_cost != null && row.quantity != null
              ? row.unit_cost * row.quantity
              : null,
          status: "open",
          created_by: auth!.profile.id,
          disposed_at: new Date().toISOString(),
          assignee_name: row.assignee_name ?? null,
        };
        const { data, error: insertError } = await insertWithSoftFallback(
          admin,
          "store_disposals",
          payload,
          ["assignee_name"]
        );
        if (insertError) throw new Error(insertError.message);

        if (batchId && row.quantity) {
          const before = batchList.find((b) => b.id === batchId);
          const beforeQty = Number(before?.remaining_quantity ?? before?.quantity ?? 0);
          const afterQty = Math.max(0, beforeQty - row.quantity);
          await admin
            .from("store_batches")
            .update({ remaining_quantity: afterQty, updated_at: new Date().toISOString() })
            .eq("id", batchId);
          await recordInventoryMovement({
            storeId,
            productId: row.product_id,
            batchId,
            movementType: "disposal",
            quantityDelta: -row.quantity,
            quantityBefore: beforeQty,
            quantityAfter: afterQty,
            unitCost: row.unit_cost ?? null,
            referenceType: "store_disposals",
            referenceId: data.id,
            createdBy: auth!.profile.id,
          });
          await syncInventoryFromBatches(storeId, row.product_id);
        }

        successCount += 1;
        await logAudit(auth!.profile.id, "import", "store_disposals", data.id, null, row, request as never);
        continue;
      }

      if (importType === "return") {
        if (!row.batch_id || row.quantity == null) throw new Error("缺少批次或數量");
        const payload: Record<string, unknown> = {
          store_id: storeId,
          product_id: row.product_id,
          batch_id: row.batch_id,
          quantity: row.quantity,
          reason: row.reason ?? null,
          status: "open",
          created_by: auth!.profile.id,
          returned_at: new Date().toISOString(),
          return_target: row.return_target ?? null,
          expected_return_date: row.expected_return_date ?? null,
          assignee_name: row.assignee_name ?? null,
        };
        const { data, error: insertError } = await insertWithSoftFallback(
          admin,
          "store_returns",
          payload,
          ["return_target", "expected_return_date", "assignee_name"]
        );
        if (insertError) throw new Error(insertError.message);

        const before = batchList.find((b) => b.id === row.batch_id);
        const beforeQty = Number(before?.remaining_quantity ?? before?.quantity ?? 0);
        const afterQty = Math.max(0, beforeQty - row.quantity);
        await admin
          .from("store_batches")
          .update({ remaining_quantity: afterQty, updated_at: new Date().toISOString() })
          .eq("id", row.batch_id);
        await recordInventoryMovement({
          storeId,
          productId: row.product_id,
          batchId: row.batch_id,
          movementType: "return",
          quantityDelta: -row.quantity,
          quantityBefore: beforeQty,
          quantityAfter: afterQty,
          referenceType: "store_returns",
          referenceId: data.id,
          createdBy: auth!.profile.id,
        });
        await syncInventoryFromBatches(storeId, row.product_id);

        successCount += 1;
        await logAudit(auth!.profile.id, "import", "store_returns", data.id, null, row, request as never);
        continue;
      }

      if (importType === "anomaly" || importType === "repair") {
        const isRepair = importType === "repair" || row.anomaly_type === "repair";
        const payload: Record<string, unknown> = {
          store_id: storeId,
          product_id: row.product_id,
          batch_id: row.batch_id,
          anomaly_type: isRepair ? "repair" : row.anomaly_type ?? "damaged",
          description: row.reason ?? null,
          quantity: row.quantity ?? null,
          status: isRepair ? "notified_vendor" : "open",
          reported_by: auth!.profile.id,
          reported_at: new Date().toISOString(),
          assignee_name: row.assignee_name ?? null,
          urgency: isRepair ? row.urgency ?? "normal" : null,
          affects_operations: false,
          customer_name: row.customer_name ?? null,
          customer_phone: row.customer_phone ?? null,
          vendor_name: row.vendor_name ?? row.supplier_name ?? null,
        };
        const { data, error: insertError } = await insertWithSoftFallback(
          admin,
          "store_anomalies",
          payload,
          ["assignee_name", "urgency", "affects_operations", "customer_name", "customer_phone", "vendor_name"]
        );
        if (insertError) throw new Error(insertError.message);
        successCount += 1;
        await logAudit(auth!.profile.id, "import", "store_anomalies", data.id, null, row, request as never);
        continue;
      }

      // expiry / batches — create new batch
      const { data, error: insertError } = await admin
        .from("store_batches")
        .insert({
          store_id: storeId,
          product_id: row.product_id,
          supplier_id: supplierId,
          batch_no: row.batch_no || `IMP-${row.row}`,
          barcode: row.barcode ?? null,
          quantity: row.quantity,
          remaining_quantity: row.quantity,
          expiry_date: row.expiry_date ?? null,
          status: "active",
          created_by: auth!.profile.id,
          received_at: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);
      await recordInventoryMovement({
        storeId,
        productId: row.product_id,
        batchId: data.id,
        movementType: "receive",
        quantityDelta: row.quantity ?? 0,
        quantityAfter: row.quantity ?? 0,
        referenceType: "store_batches",
        referenceId: data.id,
        createdBy: auth!.profile.id,
      });
      await syncInventoryFromBatches(storeId, row.product_id);
      successCount += 1;
      await logAudit(auth!.profile.id, "import", "store_batches", data.id, null, row, request as never);
    } catch (e) {
      commitErrors.push({
        row: row.row,
        message: e instanceof Error ? e.message : "匯入失敗",
      });
    }
  }

  if (resolvedJobId) {
    await admin
      .from("store_import_jobs")
      .update({
        success_count: successCount,
        failure_count: commitErrors.length,
        error_report: commitErrors,
        status: commitErrors.length && !successCount ? "failed" : "committed",
        committed_at: new Date().toISOString(),
      })
      .eq("id", resolvedJobId);
  }

  return NextResponse.json({
    job_id: resolvedJobId,
    summary: {
      total: preview.length,
      ok: successCount,
      failed: commitErrors.length,
    },
    errors: commitErrors,
  });
}
