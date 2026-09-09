"use client";

import type { DesktopPageToolbarProps } from "@/components/desktop/layout/types";

export function DesktopPageToolbar({
  title,
  description,
  totalLabel,
  sortValue,
  sortOptions,
  onSortChange,
  trailing,
}: DesktopPageToolbarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <h2 className="text-2xl font-bold text-[#153E73]">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#687386]">{description}</p>
        ) : null}
        {totalLabel ? (
          <p className="mt-2 text-sm font-semibold text-[#153E73]">{totalLabel}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {sortOptions && sortOptions.length > 0 ? (
          <label className="inline-flex items-center gap-2 text-sm text-[#687386]">
            <span className="sr-only">排序</span>
            <select
              value={sortValue}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="rounded-full border border-[#E9EDF2] bg-white px-4 py-2 text-sm font-semibold text-[#153E73]"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}
