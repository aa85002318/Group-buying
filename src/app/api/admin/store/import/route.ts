import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type PreviewRow = {
  row: number;
  barcode?: string;
  sku?: string;
  product_name?: string;
  product_id?: string | null;
  supplier_name?: string;
  category_name?: string;
  quantity?: number;
  expiry_date?: string;
  batch_no?: string;
  reason?: string;
  unit_cost?: number;
  errors: string[];
  will_create_supplier?: boolean;
  will_create_category?: boolean;
};

function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function parseWorkbook(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const type = new URL(request.url).searchParams.get("type") ?? "expiry";
  const headers =
    type === "disposal"
      ? ["barcode", "sku", "quantity", "reason", "unit_cost"]
      : ["barcode", "sku", "product_name", "supplier_name", "category_name", "quantity", "expiry_date", "batch_no"];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  XLSX.utils.book_append_sheet(wb, ws, "import");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;

  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="store-${type}-template.xlsx"`,
    },
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const form = await request.formData();
  const file = form.get("file");
  const importType = String(form.get("import_type") ?? "expiry");
  const confirm = String(form.get("confirm") ?? "") === "1";
  const jobId = form.get("job_id") ? String(form.get("job_id")) : null;

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
    .select("id, name, sku, barcode, supplier_id")
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

  const preview: PreviewRow[] = rawRows.map((r, i) => {
    const barcode = cell(r, "barcode", "條碼");
    const sku = cell(r, "sku", "SKU");
    const productName = cell(r, "product_name", "商品名稱", "name");
    const supplierName = cell(r, "supplier_name", "廠商", "供應商");
    const categoryName = cell(r, "category_name", "分類");
    const quantity = Number(cell(r, "quantity", "數量") || 0);
    const expiryRaw = r.expiry_date ?? r["效期"] ?? r["到期日"];
    const expiry_date =
      expiryRaw instanceof Date
        ? expiryRaw.toISOString().slice(0, 10)
        : cell(r, "expiry_date", "效期", "到期日");
    const batch_no = cell(r, "batch_no", "批號");
    const reason = cell(r, "reason", "原因");
    const unit_cost = Number(cell(r, "unit_cost", "成本") || 0) || undefined;

    const errors: string[] = [];
    let product =
      (barcode && byBarcode.get(barcode)) ||
      (sku && bySku.get(sku)) ||
      null;

    if (!product && productName) {
      product = productList.find((p) => p.name === productName) ?? null;
    }
    if (!product) errors.push("找不到商品（請確認條碼／SKU）");
    if (!quantity || quantity <= 0) errors.push("數量無效");
    if (importType === "expiry" && !expiry_date) errors.push("缺少效期");

    const will_create_supplier = Boolean(
      supplierName && !supplierByName.has(supplierName.toLowerCase())
    );
    const will_create_category = Boolean(
      categoryName && !categoryByName.has(categoryName.toLowerCase())
    );

    return {
      row: i + 2,
      barcode: barcode || undefined,
      sku: sku || undefined,
      product_name: product?.name || productName || undefined,
      product_id: product?.id ?? null,
      supplier_name: supplierName || undefined,
      category_name: categoryName || undefined,
      quantity,
      expiry_date: expiry_date || undefined,
      batch_no: batch_no || undefined,
      reason: reason || undefined,
      unit_cost,
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
        import_type: importType === "disposal" ? "disposal" : "expiry",
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

  // Confirm import
  let resolvedJobId = jobId;
  if (!resolvedJobId) {
    const { data: job } = await admin
      .from("store_import_jobs")
      .insert({
        import_type: importType === "disposal" ? "disposal" : "expiry",
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

  const { data: store } = await admin.from("stores").select("id").eq("is_active", true).limit(1).maybeSingle();
  if (!store?.id) {
    return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });
  }

  let successCount = 0;
  const commitErrors: Array<{ row: number; message: string }> = [];

  for (const row of preview) {
    if (row.errors.length || !row.product_id) {
      commitErrors.push({ row: row.row, message: row.errors.join("；") || "略過" });
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
      const { data, error: insertError } = await admin
        .from("store_disposals")
        .insert({
          store_id: store.id,
          product_id: row.product_id,
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
        })
        .select("id")
        .single();
      if (insertError) {
        commitErrors.push({ row: row.row, message: insertError.message });
        continue;
      }
      successCount += 1;
      await logAudit(auth!.profile.id, "import", "store_disposals", data.id, null, row, request as never);
    } else {
      const { data, error: insertError } = await admin
        .from("store_batches")
        .insert({
          store_id: store.id,
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
      if (insertError) {
        commitErrors.push({ row: row.row, message: insertError.message });
        continue;
      }
      successCount += 1;
      await logAudit(auth!.profile.id, "import", "store_batches", data.id, null, row, request as never);
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
