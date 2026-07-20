"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

const SAMPLE_HEADERS = [
  "名稱",
  "分類",
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

function downloadSample(format: "xlsx" | "csv") {
  const ws = XLSX.utils.aoa_to_sheet([SAMPLE_HEADERS, SAMPLE_ROW]);
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

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
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
        <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-6 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
          <h2 className="text-lg font-bold text-[#1E293B]">1. 下載範例檔</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            欄位包含：名稱、分類、售價、成本、SKU、現貨、預購、溫層、影片、圖片、介紹、批號、效期
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

        <section className="rounded-[20px] border border-[#E8EBF4] bg-white p-6 shadow-[0_4px_24px_rgba(30,58,138,0.06)]">
          <h2 className="text-lg font-bold text-[#1E293B]">2. 上傳並匯入</h2>
          <p className="mt-2 text-sm text-[#64748B]">選擇填寫完成的 Excel 或 CSV 檔案</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="mt-4 block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button
            className="mt-4 bg-[#FF4F7B] hover:bg-[#E63D6A]"
            disabled={!file || importing}
            onClick={handleImport}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {importing ? "匯入中…" : "開始匯入"}
          </Button>
        </section>
      </div>

      {result && (
        <div className="rounded-[20px] border border-[#E8EBF4] bg-white p-6">
          <p className="font-bold text-[#1E3A8A]">成功匯入 {result.imported} 筆商品</p>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-600">
              {result.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
