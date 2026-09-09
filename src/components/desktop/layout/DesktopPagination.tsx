"use client";

import type { DesktopPaginationProps } from "@/components/desktop/layout/types";
import { cn } from "@/lib/utils";

function pageList(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
}

export function DesktopPagination({ page, totalPages, onPageChange }: DesktopPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = pageList(page, totalPages);

  return (
    <nav aria-label="分頁" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#E9EDF2] bg-white px-3 text-sm font-semibold text-[#153E73] disabled:opacity-40"
      >
        ‹
      </button>
      {pages.map((p, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev != null && p - prev > 1;
        return (
          <span key={p} className="inline-flex items-center gap-2">
            {showEllipsis ? <span className="text-[#687386]">…</span> : null}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold",
                p === page
                  ? "bg-[#153E73] text-white"
                  : "border border-[#E9EDF2] bg-white text-[#153E73]"
              )}
            >
              {p}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#E9EDF2] bg-white px-3 text-sm font-semibold text-[#153E73] disabled:opacity-40"
      >
        ›
      </button>
    </nav>
  );
}
