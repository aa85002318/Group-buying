"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-4">
      {(onSearchChange || toolbar) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {onSearchChange ? (
            <Input
              className="h-12 w-full rounded-[16px] sm:max-w-xs"
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          ) : null}
          {toolbar ? <div className="flex flex-wrap items-center gap-3">{toolbar}</div> : null}
        </div>
      )}

      {/* Mobile card list */}
      <div className="admin-table-wrap md:hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-skeleton h-24 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--admin-muted)]">{emptyText}</p>
        ) : (
          <div className="divide-y divide-[var(--admin-border)]">
            {rows.map((row) => (
              <div key={row.id} className="space-y-2.5 p-4 transition hover:bg-[var(--admin-hover)]">
                {columns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                    <span className="shrink-0 text-[var(--admin-muted)]">{col.header}</span>
                    <div className="min-w-0 text-right text-[var(--admin-title)]">
                      {col.render(row)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="admin-table-wrap hidden md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "sticky top-0 z-[1] bg-[var(--admin-table-header)] p-3.5 text-left text-xs font-bold uppercase tracking-wide text-[var(--admin-muted)]",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-[var(--admin-muted)]">
                    載入中…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-[var(--admin-muted)]">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--admin-border)] transition hover:bg-[var(--admin-hover)]"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("p-3.5 align-middle text-[var(--admin-text)]", col.className)}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages && totalPages > 1 && page && onPageChange ? (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            上一頁
          </Button>
          <span className="text-sm text-[var(--admin-muted)]">
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
