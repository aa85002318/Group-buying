"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type PreviewRow = {
  row: number;
  product_name?: string;
  barcode?: string;
  quantity?: number;
  expiry_date?: string;
  errors: string[];
  will_create_supplier?: boolean;
  will_create_category?: boolean;
};

type Summary = {
  total: number;
  ok: number;
  failed: number;
  missing_barcode?: number;
  new_suppliers?: number;
  new_categories?: number;
};

type AdminImportPreviewProps = {
  importType: "expiry" | "disposal";
  onCommitted?: () => void;
};

export function AdminImportPreview({ importType, onCommitted }: AdminImportPreviewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const hasErrors = useMemo(() => preview.some((p) => p.errors.length > 0), [preview]);

  const runPreview = async () => {
    if (!file) return;
    setLoading(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("import_type", importType);
      form.set("confirm", "0");
      const res = await fetch("/api/admin/store/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "預覽失敗");
      setPreview(data.preview ?? []);
      setSummary(data.summary ?? null);
      setJobId(data.job_id ?? null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "預覽失敗");
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    if (!file) return;
    setLoading(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("import_type", importType);
      form.set("confirm", "1");
      if (jobId) form.set("job_id", jobId);
      const res = await fetch("/api/admin/store/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "匯入失敗");
      setMsg(`匯入完成：成功 ${data.summary?.ok ?? 0}／失敗 ${data.summary?.failed ?? 0}`);
      onCommitted?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "匯入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-[16px] border border-[#E9DED4] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/admin/store/import?type=${importType}`}
          className="text-sm font-medium text-[#6F4E37] underline"
        >
          下載 Excel 範本
        </a>
      </div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setPreview([]);
          setSummary(null);
          setJobId(null);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={!file || loading} onClick={() => void runPreview()}>
          解析預覽
        </Button>
        <Button
          type="button"
          disabled={!file || !preview.length || loading}
          onClick={() => void commit()}
        >
          確認匯入
        </Button>
      </div>
      {summary ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <p>總筆數：{summary.total}</p>
          <p className="text-[#2E7D5B]">可成功：{summary.ok}</p>
          <p className="text-[#C94C4C]">缺漏／錯誤：{summary.failed}</p>
          <p>找不到商品：{summary.missing_barcode ?? 0}</p>
          <p>即將新增廠商：{summary.new_suppliers ?? 0}</p>
          <p>即將新增分類：{summary.new_categories ?? 0}</p>
        </div>
      ) : null}
      {hasErrors ? (
        <p className="text-sm text-amber-700">部分列有錯誤，確認匯入時會略過錯誤列。</p>
      ) : null}
      {msg ? <p className="text-sm text-[#2F2925]">{msg}</p> : null}
      {preview.length ? (
        <div className="max-h-80 overflow-auto rounded-[12px] border border-[#E9DED4]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#FAF6F1]">
              <tr>
                <th className="px-3 py-2">列</th>
                <th className="px-3 py-2">商品</th>
                <th className="px-3 py-2">條碼</th>
                <th className="px-3 py-2">數量</th>
                <th className="px-3 py-2">效期</th>
                <th className="px-3 py-2">狀態</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p) => (
                <tr key={p.row} className="border-t border-[#E9DED4]">
                  <td className="px-3 py-2">{p.row}</td>
                  <td className="px-3 py-2">{p.product_name ?? "—"}</td>
                  <td className="px-3 py-2">{p.barcode ?? "—"}</td>
                  <td className="px-3 py-2">{p.quantity ?? "—"}</td>
                  <td className="px-3 py-2">{p.expiry_date ?? "—"}</td>
                  <td className="px-3 py-2">
                    {p.errors.length ? (
                      <span className="text-[#C94C4C]">{p.errors.join("；")}</span>
                    ) : (
                      <span className="text-[#2E7D5B]">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
