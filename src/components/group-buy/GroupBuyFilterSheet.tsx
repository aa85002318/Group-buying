"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import {
  SORT_LABELS,
  type GroupBuySort,
  type GroupBuyTab,
  type GroupBuyPageSettings,
} from "@/lib/group-buy/page-settings";

export type GroupBuyFilterValues = {
  sort: GroupBuySort;
  fulfillment: string;
  status: GroupBuyTab;
  category: string;
  priceMin: string;
  priceMax: string;
};

const FULFILLMENT_OPTIONS = [
  { value: "", label: "全部取貨方式" },
  { value: "store_pickup", label: "門市取貨" },
  { value: "ambient", label: "常溫宅配" },
  { value: "chilled", label: "冷藏宅配" },
  { value: "frozen", label: "冷凍宅配" },
  { value: "cvs", label: "超商取貨" },
];

const STATUS_OPTIONS: { value: GroupBuyTab; label: string }[] = [
  { value: "all", label: "全部狀態" },
  { value: "active", label: "熱烈開團" },
  { value: "ending_soon", label: "即將結團" },
  { value: "upcoming", label: "即將開團" },
  { value: "ended", label: "已結團" },
];

export function GroupBuyFilterSheet({
  open,
  onClose,
  settings,
  draft,
  onDraftChange,
  categories,
  onClear,
  onApply,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  settings: GroupBuyPageSettings;
  draft: GroupBuyFilterValues;
  onDraftChange: (next: GroupBuyFilterValues) => void;
  categories: string[];
  onClear: () => void;
  onApply: () => void;
  variant: "sheet" | "panel";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (variant === "sheet") document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, variant]);

  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = panelRef.current.querySelector<HTMLElement>(
        "button, select, input"
      );
      focusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  const body = (
    <div className="space-y-4">
      {settings.enabledSorts.length > 0 && (
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#153E73]">排序方式</span>
          <select
            value={draft.sort}
            onChange={(e) =>
              onDraftChange({ ...draft, sort: e.target.value as GroupBuySort })
            }
            className="h-11 w-full rounded-xl border border-[#E9EDF2] bg-white px-3 text-sm text-[#153E73] outline-none focus:ring-2 focus:ring-[#79C7E8]/40"
            aria-label="排序方式"
          >
            {settings.enabledSorts.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      )}

      {settings.enabledFilters.fulfillment && (
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#153E73]">取貨方式</span>
          <select
            value={draft.fulfillment}
            onChange={(e) => onDraftChange({ ...draft, fulfillment: e.target.value })}
            className="h-11 w-full rounded-xl border border-[#E9EDF2] bg-white px-3 text-sm text-[#153E73] outline-none focus:ring-2 focus:ring-[#79C7E8]/40"
            aria-label="取貨方式"
          >
            {FULFILLMENT_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {settings.enabledFilters.status && (
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#153E73]">商品狀態</span>
          <select
            value={draft.status}
            onChange={(e) =>
              onDraftChange({ ...draft, status: e.target.value as GroupBuyTab })
            }
            className="h-11 w-full rounded-xl border border-[#E9EDF2] bg-white px-3 text-sm text-[#153E73] outline-none focus:ring-2 focus:ring-[#79C7E8]/40"
            aria-label="商品狀態"
          >
            {STATUS_OPTIONS.filter((o) =>
              o.value === "all" ? true : settings.enabledTabs.includes(o.value)
            ).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {settings.enabledFilters.category && categories.length > 0 && (
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#153E73]">分類</span>
          <select
            value={draft.category}
            onChange={(e) => onDraftChange({ ...draft, category: e.target.value })}
            className="h-11 w-full rounded-xl border border-[#E9EDF2] bg-white px-3 text-sm text-[#153E73] outline-none focus:ring-2 focus:ring-[#79C7E8]/40"
            aria-label="分類"
          >
            <option value="">全部分類</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* TODO: wire price range when API supports min/max price query params */}
      {settings.enabledFilters.price && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#153E73]">最低價</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.priceMin}
              onChange={(e) => onDraftChange({ ...draft, priceMin: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E9EDF2] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#79C7E8]/40"
              aria-label="最低價"
              placeholder="0"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#153E73]">最高價</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.priceMax}
              onChange={(e) => onDraftChange({ ...draft, priceMax: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E9EDF2] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#79C7E8]/40"
              aria-label="最高價"
              placeholder="不限"
            />
          </label>
        </div>
      )}
    </div>
  );

  const actions = (
    <div className="mt-5 flex gap-2">
      <button
        type="button"
        onClick={onClear}
        className="h-11 flex-1 rounded-full border border-[#E9EDF2] bg-white text-sm font-semibold text-[#153E73]"
        aria-label="清除條件"
      >
        清除條件
      </button>
      <button
        type="button"
        onClick={onApply}
        className="h-11 flex-1 rounded-full bg-[#F16458] text-sm font-bold text-white hover:bg-[#e05549]"
        aria-label="套用篩選"
      >
        套用篩選
      </button>
    </div>
  );

  if (variant === "panel") {
    return (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        className="relative z-20 mx-auto mt-3 w-full max-w-[960px] rounded-2xl border border-[#E9EDF2] bg-white p-4 shadow-[0_6px_20px_rgba(21,62,115,0.08)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id={titleId} className="text-base font-bold text-[#153E73]">
            篩選條件
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#153E73]"
            aria-label="關閉篩選"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {body}
        {actions}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-[rgba(21,62,115,0.42)]"
        aria-label="關閉篩選"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[24px] bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_28px_rgba(21,62,115,0.12)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E9EDF2]" aria-hidden />
        <div className="mb-3 flex items-center justify-between">
          <h2 id={titleId} className="text-base font-bold text-[#153E73]">
            篩選條件
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#153E73]"
            aria-label="關閉篩選"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {body}
        {actions}
      </div>
    </div>
  );
}

export function hasActiveFilters(v: {
  fulfillment: string;
  category: string;
  sort: GroupBuySort;
  defaultSort: GroupBuySort;
}): boolean {
  return Boolean(v.fulfillment || v.category || v.sort !== v.defaultSort);
}
