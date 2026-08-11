"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

const SAMPLE_HEADERS = [
  "名稱",
  "分類",
  "廠商",
  "售價",
  "成本",
  "SKU",
  "現貨",
  "預購",
  "溫層",
  "影片",
  "圖片",
  "介紹",
  "批號",
  "效期",
];

const SAMPLE_ROW = [
  "示範商品",
  "食品",
  "",
  "299",
  "180",
  "SKU-DEMO001",
  "100",
  "0",
  "常溫",
  "",
  "https://example.com/image.jpg",
  "商品介紹文字",
  "LOT202607",
  "2027-12-31",
];

type Option = { id: string; name: string; is_active?: boolean };

function downloadSample(format: "xlsx" | "csv") {
  const ws = XLSX.utils.aoa_to_sheet([SAMPLE_HEADERS, SAMPLE_ROW]);
  if (ws.F2) {
    ws.F2.t = "s";
    ws.F2.v = "SKU-DEMO001";
    ws.F2.z = "@";
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "商品匯入範例");
  XLSX.writeFile(wb, `chimeidiy-product-import-sample.${format}`, {
    bookType: format === "csv" ? "csv" : "xlsx",
  });
}

export default function AdminProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/suppliers").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ])
      .then(([supplierRes, categoryRes]) => {
        setSuppliers(
          ((supplierRes.suppliers ?? []) as Option[]).filter((s) => s.is_active !== false)
        );
        setCategories((categoryRes.categories ?? []) as Option[]);
      })
      .catch(() => {
        setSuppliers([]);
        setCategories([]);
      });
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("檔案裡沒有工作表");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: true,
      });
      if (rows.length === 0) throw new Error("沒有可匯入的資料列，請確認第一列是欄位名稱");

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          supplier_id: supplierId || undefined,
          default_category_id: categoryId || undefined,
        }),
      });
      const text = await res.text();
      let data: { error?: string; imported?: number; errors?: string[] };
      try {
        data = JSON.parse(text) as { error?: string; imported?: number; errors?: string[] };
      } catch {
        throw new Error(
          res.ok ? "伺服器回傳格式錯誤" : `匯入失敗（HTTP ${res.status}）`
        );
      }
      if (!res.ok) throw new Error(data.error ?? "匯入失敗");
      setResult({ imported: data.imported ?? 0, errors: data.errors ?? [] });
    } catch (e) {
      setResult({
        imported: 0,
        errors: [e instanceof Error ? e.message : "匯入失敗"],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="批次匯入商品"
        description="支援 Excel / CSV，可一次匯入多筆商品"
        actions={
          <Link href="/admin/products">
            <Button variant="outline">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              返回商品列表
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[20px] border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">1. 下載範例檔</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            欄位包含：名稱、分類、廠商、售價、成本、SKU、現貨、預購、溫層、影片、圖片、介紹、批號、效期。分類與廠商請使用下方後台既有選項，不要自行新增名稱。
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
          <h2 className="text-lg font-bold text-foreground">2. 選擇廠商與分類</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            資料來自後台供應商／商品分類。Excel 未填時會套用這裡的選擇。
          </p>
          <label className="mt-4 block text-sm font-medium text-foreground">廠商（供應商）</label>
          <select
            className="mt-1 h-12 w-full rounded-[16px] border border-border bg-white px-3 text-sm"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">不指定／依 Excel 廠商欄</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-foreground-muted">
            {suppliers.length === 0 ? (
              <>
                尚無供應商，請先到{" "}
                <Link href="/admin/suppliers" className="underline">
                  供應商管理
                </Link>{" "}
                新增。
              </>
            ) : (
              <>共 {suppliers.length} 家後台廠商</>
            )}
          </p>

          <label className="mt-4 block text-sm font-medium text-foreground">預設分類</label>
          <select
            className="mt-1 h-12 w-full rounded-[16px] border border-border bg-white px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">不指定／依 Excel 分類欄</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-foreground-muted">
            {categories.length === 0 ? (
              <>
                尚無分類，請先到{" "}
                <Link href="/admin/products/categories" className="underline">
                  分類管理
                </Link>{" "}
                新增。
              </>
            ) : (
              <>Excel 分類欄需與後台名稱完全一致，例如：{categories.slice(0, 4).map((c) => c.name).join("、")}</>
            )}
          </p>
        </section>
      </div>

      <section className="rounded-[20px] border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">3. 上傳並匯入</h2>
          <p className="mt-2 text-sm text-foreground-secondary">選擇填寫完成的 Excel 或 CSV 檔案</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="mt-4 block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button
            className="mt-4 bg-primary hover:bg-[#E63D6A]"
            disabled={!file || importing}
            onClick={handleImport}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {importing ? "匯入中…" : "開始匯入"}
          </Button>
        </section>

      {result && (
        <div className="rounded-[20px] border border-border bg-white p-6">
          <p className="font-bold text-foreground">成功匯入 {result.imported} 筆商品</p>
          {result.imported > 0 ? (
            <p className="mt-2 text-sm text-foreground-secondary">
              匯入商品預設為草稿、未上架，可在商品主檔搜尋名稱後編輯上架。
            </p>
          ) : null}
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-600">
              {result.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          {result.imported > 0 ? (
            <Link href="/admin/products" className="mt-4 inline-block">
              <Button variant="secondary">前往商品主檔</Button>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
