"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

const ENGLISH_HEADERS = [
  "product_name",
  "product_slug",
  "product_sku",
  "brand",
  "category_path",
  "additional_categories",
  "variant_name",
  "variant_sku",
  "price",
  "sale_price",
  "stock",
  "safety_stock",
  "storage_type",
  "image_url",
  "status",
  "tags",
  "search_keywords",
] as const;

const SAMPLE_ROW: Record<(typeof ENGLISH_HEADERS)[number], string> = {
  product_name: "示範高筋麵粉 1kg",
  product_slug: "demo-high-gluten-flour",
  product_sku: "BM-FLOUR-001",
  brand: "示範品牌",
  category_path: "麵粉 > 高筋麵粉",
  additional_categories: "",
  variant_name: "1kg",
  variant_sku: "BM-FLOUR-001-1KG",
  price: "299",
  sale_price: "279",
  stock: "100",
  safety_stock: "10",
  storage_type: "ambient",
  image_url: "https://example.com/image.jpg",
  status: "draft",
  tags: "麵粉,烘焙",
  search_keywords: "高筋,麵包",
};

type ImportStep = "upload" | "preview" | "confirm" | "done";

type ImportResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

function downloadSample(format: "xlsx" | "csv") {
  const ws = XLSX.utils.aoa_to_sheet([
    [...ENGLISH_HEADERS],
    ENGLISH_HEADERS.map((h) => SAMPLE_ROW[h]),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "product-import");
  XLSX.writeFile(wb, `baking-product-import-sample.${format}`, {
    bookType: format === "csv" ? "csv" : "xlsx",
  });
}

const CHUNK_SIZE = 500;

export default function AdminProductImportsPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
    setRows(parsed);
    setStep("preview");
    setResult(null);
  };

  const runImport = async () => {
    setImporting(true);
    setStep("confirm");
    const aggregated: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const res = await fetch("/api/admin/product-imports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "匯入失敗");
        aggregated.success += data.success ?? 0;
        aggregated.failed += data.failed ?? 0;
        aggregated.errors.push(...(data.errors ?? []));
      }
      setResult(aggregated);
      setStep("done");
    } catch (e) {
      setResult({
        success: aggregated.success,
        failed: aggregated.failed + (rows.length - aggregated.success - aggregated.failed),
        errors: [
          ...aggregated.errors,
          { row: 0, message: e instanceof Error ? e.message : "匯入失敗" },
        ],
      });
      setStep("done");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="批次匯入商品"
        description="支援英文欄位 CSV / Excel，依 SKU 新增或更新商品（烘焙材料分類路徑）"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products/import">
              <Button variant="outline">舊版匯入（中文欄位）</Button>
            </Link>
            <Link href="/admin/baking-materials">
              <Button variant="outline">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                烘焙材料
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[20px] border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">1. 下載範例檔</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            欄位：product_name, product_sku, brand, category_path（例：麵粉 &gt; 高筋麵粉）等
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadSample("xlsx")}>
              <Download className="mr-1.5 h-4 w-4" />
              下載 Excel 範例
            </Button>
            <Button variant="outline" onClick={() => downloadSample("csv")}>
              <Download className="mr-1.5 h-4 w-4" />
              下載 CSV 範例
            </Button>
          </div>
        </section>

        <section className="rounded-[20px] border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">2. 上傳檔案</h2>
          <p className="mt-2 text-sm text-foreground-secondary">選擇填寫完成的 Excel 或 CSV</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="mt-4 block w-full text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {rows.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">已讀取 {rows.length} 筆資料</p>
          )}
        </section>
      </div>

      {step !== "upload" && previewRows.length > 0 && (
        <section className="rounded-[20px] border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">3. 預覽（前 10 筆）</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted">
                <tr>
                  {ENGLISH_HEADERS.slice(0, 8).map((h) => (
                    <th key={h} className="p-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {ENGLISH_HEADERS.slice(0, 8).map((h) => (
                      <td key={h} className="p-2">
                        {row[h] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              className="bg-primary hover:bg-[#E63D6A]"
              disabled={importing}
              onClick={() => void runImport()}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              {importing ? "匯入中…" : `確認匯入 ${rows.length} 筆`}
            </Button>
            <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); }}>
              重新選擇
            </Button>
          </div>
        </section>
      )}

      {step === "done" && result && (
        <section className="rounded-[20px] border border-border bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="font-bold text-foreground">
              成功 {result.success} 筆，失敗 {result.failed} 筆
            </p>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-3 max-h-60 space-y-1 overflow-y-auto text-sm text-red-600">
              {result.errors.map((err, i) => (
                <li key={`${err.row}-${i}`}>
                  {err.row > 0 ? `第 ${err.row} 列：` : ""}
                  {err.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
