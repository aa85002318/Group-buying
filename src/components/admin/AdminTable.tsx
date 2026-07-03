"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

export type AdminColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  search,
  onSearchChange,
  searchPlaceholder = "搜尋…",
  loading,
  emptyText = "尚無資料",
  page,
  totalPages,
  onPageChange,
  toolbar,
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyText?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  toolbar?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {(onSearchChange || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {onSearchChange ? (
            <Input
              className="w-full sm:max-w-xs"
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          ) : null}
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      )}

      {/* Mobile card list */}
      <div className="rounded-xl border border-border bg-white shadow-card md:hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">載入中…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="space-y-2 p-4">
                {columns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                    <span className="shrink-0 text-muted-foreground">{col.header}</span>
                    <div className="min-w-0 text-right">{col.render(row)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-white shadow-card md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`p-3 text-left font-medium ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-muted-foreground">
                  載入中…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  {columns.map((col) => (
                    <td key={col.key} className={`p-3 align-middle ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages && totalPages > 1 && page && onPageChange ? (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            上一頁
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            下一頁
          </Button>
        </div>
      ) : null}
    </div>
  );
}
