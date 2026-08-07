"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildImportErrorCsv,
  getStoreExcelTemplate,
  type StoreExcelImportType,
} from "@/lib/admin/store-excel";
import { cn } from "@/lib/utils";

type PreviewRow = {
  row: number;
  product_name?: string;
  barcode?: string;
  batch_no?: string;
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
  importType: StoreExcelImportType;
  onCommitted?: () => void;
};

const STEPS = ["上傳檔案", "欄位檢查", "預覽確認", "正式匯入"] as const;

export function AdminImportPreview({ importType, onCommitted }: AdminImportPreviewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [committed, setCommitted] = useState(false);

  const tpl = getStoreExcelTemplate(importType);
  const errorRows = useMemo(() => preview.filter((p) => p.errors.length > 0), [preview]);
  const hasErrors = errorRows.length > 0;
  const canCommit = Boolean(file && preview.length && summary && summary.ok > 0 && confirmed && !committed);

  const stepIndex = committed
    ? 3
    : preview.length
      ? 2
      : file
        ? 1
        : 0;

  const runPreview = async () => {
    if (!file) return;
    setLoading(true);
    setMsg(null);
    setConfirmed(false);
    setCommitted(false);
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
    if (!file || !canCommit) return;
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
      setCommitted(true);
      setMsg(`匯入完成：成功 ${data.summary?.ok ?? 0}／失敗 ${data.summary?.failed ?? 0}`);
      onCommitted?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "匯入失敗");
    } finally {
      setLoading(false);
    }
  };

  const downloadErrors = () => {
    const csv = buildImportErrorCsv(errorRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tpl?.fileStem ?? "匯入"}-錯誤明細.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 rounded-[16px] border border-[#E5E8EE] bg-white p-4">
      <ol className="flex flex-wrap gap-2 text-xs sm:text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium",
              i <= stepIndex
                ? "bg-[#153E73] text-white"
                : "bg-[#F7F8FA] text-[#756B64]"
            )}
          >
            <span className="tabular-nums">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`/api/admin/store/import?type=${importType}`}
          className="text-sm font-medium text-[#153E73] underline"
        >
          下載中文 Excel 範本
        </a>
        {tpl ? (
          <span className="text-xs text-[#756B64]">檔名：{tpl.fileStem}.xlsx</span>
        ) : null}
      </div>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setPreview([]);
          setSummary(null);
          setJobId(null);
          setConfirmed(false);
          setCommitted(false);
          setMsg(null);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!file || loading}
          onClick={() => void runPreview()}
        >
          解析預覽
        </Button>
        {hasErrors ? (
          <Button type="button" variant="outline" onClick={downloadErrors}>
            下載錯誤明細
          </Button>
        ) : null}
      </div>

      {summary ? (
        <div className="grid gap-2 rounded-[12px] bg-[#F7F8FA] p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>總筆數：{summary.total}</p>
          <p className="text-[#2E7D5B]">可成功：{summary.ok}</p>
          <p className="text-[#C94C4C]">缺漏／錯誤：{summary.failed}</p>
          <p>找不到商品：{summary.missing_barcode ?? 0}</p>
          <p>即將新增廠商：{summary.new_suppliers ?? 0}</p>
          <p>即將新增分類：{summary.new_categories ?? 0}</p>
        </div>
      ) : null}

      {hasErrors ? (
        <p className="text-sm text-amber-800">
          部分列有錯誤，可先下載錯誤明細修正後重傳。確認匯入時會略過錯誤列。
        </p>
      ) : null}

      {preview.length && summary && summary.ok > 0 ? (
        <label className="flex items-start gap-2 text-sm text-[#2F2925]">
          <input
            type="checkbox"
            className="mt-1"
            checked={confirmed}
            disabled={committed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            我已核對預覽內容（成功 {summary.ok} 筆
            {hasErrors ? `，略過錯誤 ${summary.failed} 筆` : ""}
            ），確認寫入系統。
          </span>
        </label>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-[#153E73] text-white hover:bg-[#0f2f58]"
          disabled={!canCommit || loading}
          onClick={() => void commit()}
        >
          確認正式匯入
        </Button>
      </div>

      {msg ? <p className="text-sm text-[#2F2925]">{msg}</p> : null}

      {preview.length ? (
        <div className="max-h-80 overflow-auto rounded-[12px] border border-[#E5E8EE]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#F7F8FA]">
              <tr>
                <th className="px-3 py-2">列</th>
                <th className="px-3 py-2">商品</th>
                <th className="px-3 py-2">條碼</th>
                <th className="px-3 py-2">批號</th>
                <th className="px-3 py-2">數量</th>
                <th className="px-3 py-2">效期</th>
                <th className="px-3 py-2">狀態</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p) => (
                <tr key={p.row} className="border-t border-[#E5E8EE]">
                  <td className="px-3 py-2">{p.row}</td>
                  <td className="px-3 py-2">{p.product_name ?? "—"}</td>
                  <td className="px-3 py-2">{p.barcode ?? "—"}</td>
                  <td className="px-3 py-2">{p.batch_no ?? "—"}</td>
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
