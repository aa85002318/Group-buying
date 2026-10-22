"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { formatCurrency, formatDate } from "@/lib/utils";

type InquiryItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_spec: string | null;
  quantity: number;
  note: string | null;
  sort_order: number | null;
};

type QuotationBrief = {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number | null;
};

type Inquiry = {
  id: string;
  company_name: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  inquiry_type: string | null;
  status: string;
  message: string | null;
  source?: string | null;
  delivery_info?: string | null;
  preferred_contact_time?: string | null;
  created_at: string;
  corporate_inquiry_items?: InquiryItem[] | null;
  quotations?: QuotationBrief[] | null;
};

const STATUS_LABELS: Record<string, string> = {
  open: "待處理",
  contacted: "已聯繫",
  quoted: "已報價",
  won: "成交",
  closed: "結案",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[#FFF1F0] text-[#C0392B]",
  contacted: "bg-[#FFF7E0] text-[#8A6A00]",
  quoted: "bg-[#EAF2FF] text-[#153E73]",
  won: "bg-[#E8F7EE] text-[#1E7B47]",
  closed: "bg-gray-100 text-gray-500",
};

const SOURCE_LABELS: Record<string, string> = {
  corporate: "企業／福委",
  product: "商品詢價",
};

const STATUS_FILTERS = [
  { value: "", label: "全部" },
  { value: "open", label: "待處理" },
  { value: "contacted", label: "已聯繫" },
  { value: "quoted", label: "已報價" },
  { value: "closed", label: "結案" },
];

const SOURCE_FILTERS = [
  { value: "", label: "全部來源" },
  { value: "product", label: "商品詢價" },
  { value: "corporate", label: "企業／福委" },
];

export default function AdminCorporatePage() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const latest = useLatestRequest();

  const load = useCallback(() => {
    const isLatest = latest();
    setLoading(true);
    setError(null);
    fetch("/api/admin/corporate-inquiries")
      .then((r) => r.json())
      .then((d) => {
        if (!isLatest()) return;
        if (d.error) {
          setError(String(d.error));
          setRows([]);
          return;
        }
        setRows((d.inquiries ?? []) as Inquiry[]);
      })
      .catch(() => {
        if (isLatest()) setError("載入失敗，請重新整理。");
      })
      .finally(() => {
        if (isLatest()) setLoading(false);
      });
  }, [latest]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/corporate-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "更新狀態失敗");
        return;
      }
      // 伺服器已更新，本地直接改，不用重新抓整份清單。
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      setError("更新狀態失敗");
    } finally {
      setBusyId(null);
    }
  };

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (statusFilter && r.status !== statusFilter) return false;
        if (sourceFilter && (r.source ?? "corporate") !== sourceFilter) return false;
        return true;
      }),
    [rows, statusFilter, sourceFilter]
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="詢價管理"
        description="企業／福委合作詢價，以及前台客戶送出的商品詢價單。"
        actions={
          <Link href="/admin/quotations">
            <Button variant="outline">報價單列表</Button>
          </Link>
        }
      />

      {error ? (
        <p className="rounded-xl border border-[#F5C6C2] bg-[#FFF1F0] px-4 py-3 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || "all-status"}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === f.value
                ? "bg-[#153E73] text-white"
                : "bg-white text-[#667085] ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {SOURCE_FILTERS.map((f) => (
          <button
            key={f.value || "all-source"}
            type="button"
            onClick={() => setSourceFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              sourceFilter === f.value
                ? "bg-[#153E73] text-white"
                : "bg-white text-[#667085] ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#8A94A6]">共 {visible.length} 筆</span>
      </div>

      {loading ? (
        <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-[#8A94A6]">
          載入中…
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-[#8A94A6]">
          尚無符合條件的詢價單
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((row) => {
            const items = (row.corporate_inquiry_items ?? [])
              .slice()
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            const quotes = row.quotations ?? [];
            const source = row.source ?? "corporate";
            return (
              <article
                key={row.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#153E73]">
                        {row.company_name || "（個人）"}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          STATUS_STYLES[row.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                      <span className="rounded-full bg-[#F4F6FA] px-2 py-0.5 text-[11px] text-[#667085]">
                        {SOURCE_LABELS[source] ?? source}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#667085]">
                      {[row.contact_name, row.contact_phone, row.contact_email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#8A94A6]">{formatDate(row.created_at)}</span>
                </header>

                {items.length > 0 ? (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full min-w-[420px] text-xs">
                      <thead className="bg-[#F8FAFC] text-[#667085]">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium">商品</th>
                          <th className="px-2 py-1.5 text-left font-medium">規格</th>
                          <th className="px-2 py-1.5 text-right font-medium">數量</th>
                          <th className="px-2 py-1.5 text-left font-medium">備註</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-t border-gray-100">
                            <td className="px-2 py-1.5">
                              {item.product_id ? (
                                <Link
                                  href={`/admin/products/${item.product_id}`}
                                  className="text-[#153E73] underline"
                                >
                                  {item.product_name}
                                </Link>
                              ) : (
                                item.product_name
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-[#667085]">
                              {item.product_spec || "—"}
                            </td>
                            <td className="px-2 py-1.5 text-right">{item.quantity}</td>
                            <td className="px-2 py-1.5 text-[#667085]">{item.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                  {row.delivery_info ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-[#8A94A6]">配送資訊</dt>
                      <dd className="text-[#344054]">{row.delivery_info}</dd>
                    </div>
                  ) : null}
                  {row.preferred_contact_time ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-[#8A94A6]">方便聯絡時間</dt>
                      <dd className="text-[#344054]">{row.preferred_contact_time}</dd>
                    </div>
                  ) : null}
                  {row.message && row.message !== "（商品詢價）" ? (
                    <div className="flex gap-2 sm:col-span-2">
                      <dt className="shrink-0 text-[#8A94A6]">需求說明</dt>
                      <dd className="whitespace-pre-wrap text-[#344054]">{row.message}</dd>
                    </div>
                  ) : null}
                </dl>

                {quotes.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs">
                    <span className="text-[#8A94A6]">已開報價單</span>
                    {quotes.map((q) => (
                      <Link
                        key={q.id}
                        href={`/admin/quotations/${q.id}`}
                        className="rounded-full bg-white px-2 py-0.5 text-[#153E73] underline ring-1 ring-gray-200"
                      >
                        {q.quote_number}
                        {q.total_amount != null ? ` · ${formatCurrency(q.total_amount)}` : ""}
                      </Link>
                    ))}
                  </div>
                ) : null}

                <footer className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <Link href={`/admin/quotations/new?inquiry=${row.id}`}>
                    <Button size="sm">轉成報價單</Button>
                  </Link>
                  {row.status === "open" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === row.id}
                      onClick={() => void updateStatus(row.id, "contacted")}
                    >
                      標記已聯繫
                    </Button>
                  ) : null}
                  {row.status !== "quoted" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === row.id}
                      onClick={() => void updateStatus(row.id, "quoted")}
                    >
                      標記已報價
                    </Button>
                  ) : null}
                  {row.status !== "closed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === row.id}
                      onClick={() => void updateStatus(row.id, "closed")}
                    >
                      結案
                    </Button>
                  ) : null}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
