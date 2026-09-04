"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  QUOTATION_STATUS_LABELS,
  type QuotationStatus,
} from "@/lib/admin/quotations";
import { formatCurrency, formatDate } from "@/lib/utils";

type Row = {
  id: string;
  quote_number: string;
  company_name: string | null;
  contact_name: string;
  contact_phone: string | null;
  status: QuotationStatus;
  total_amount: number;
  valid_until: string | null;
  item_count?: number;
  created_at: string;
};

export default function AdminQuotationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/quotations?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setRows((data.quotations ?? []) as Row[]);
      setTotal(Number(data.total) || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="報價單"
        description="建立客戶報價、列印，並可轉成正式訂單。"
        actions={
          <Link href="/admin/quotations/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              新建報價單
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input-field h-10 w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">全部狀態</option>
          {Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-sm text-[#8A94A6]">共 {total} 筆</span>
      </div>

      {error ? (
        <p className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <AdminTable
        columns={[
          {
            key: "quote_number",
            header: "報價單號",
            render: (r) => (
              <Link href={`/admin/quotations/${r.id}`} className="font-semibold text-[#153E73] underline">
                {r.quote_number}
              </Link>
            ),
          },
          {
            key: "customer",
            header: "客戶",
            render: (r) => (
              <div>
                <p className="font-medium">{r.company_name || r.contact_name || "—"}</p>
                <p className="text-xs text-[#8A94A6]">
                  {[r.contact_name, r.contact_phone].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge
                label={QUOTATION_STATUS_LABELS[r.status] ?? r.status}
                variant={
                  r.status === "converted"
                    ? "success"
                    : r.status === "draft"
                      ? "secondary"
                      : r.status === "cancelled" || r.status === "expired"
                        ? "secondary"
                        : "primary"
                }
              />
            ),
          },
          {
            key: "total",
            header: "合計",
            render: (r) => formatCurrency(Number(r.total_amount) || 0),
          },
          {
            key: "valid",
            header: "效期",
            render: (r) => (r.valid_until ? r.valid_until : "—"),
          },
          {
            key: "created",
            header: "建立時間",
            render: (r) => formatDate(r.created_at),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap justify-end gap-1">
                <Link href={`/admin/quotations/${r.id}`}>
                  <Button size="sm" variant="secondary">
                    編輯
                  </Button>
                </Link>
                <Link href={`/admin/quotations/${r.id}/print`} target="_blank">
                  <Button size="sm" variant="outline">
                    列印
                  </Button>
                </Link>
              </div>
            ),
          },
        ]}
        rows={rows}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋單號、公司、聯絡人、電話…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={setPageSize}
        totalCount={total}
      />
    </div>
  );
}
