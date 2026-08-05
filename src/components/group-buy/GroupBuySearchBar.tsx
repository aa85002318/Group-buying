"use client";

import { FormEvent, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Group-buy hub floating search — overlaps hero bottom; filter opens sheet/panel.
 */
export function GroupBuySearchBar({
  placeholder = "搜尋團購商品、品牌或關鍵字",
  seam = true,
  defaultValue = "",
  onSearch,
  onOpenFilters,
  filterActive = false,
}: {
  placeholder?: string;
  seam?: boolean;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  onOpenFilters?: () => void;
  filterActive?: boolean;
}) {
  const [q, setQ] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch?.(q.trim());
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="團購搜尋"
      className={cn(
        "relative z-10 mx-auto flex w-full min-w-0 items-center gap-2 bg-white pl-4 pr-2",
        "h-14 md:h-[60px] md:max-w-[960px]",
        seam && "-mt-7 md:-mt-8"
      )}
      style={{
        borderRadius: 9999,
        boxShadow: "0 6px 20px rgba(21, 62, 115, 0.08)",
        outline: focused ? "3px solid rgba(121, 199, 232, 0.3)" : undefined,
        outlineOffset: 0,
      }}
    >
      <Search className="h-5 w-5 shrink-0 text-[#153E73]" strokeWidth={1.75} aria-hidden />
      <label className="sr-only" htmlFor="group-buy-search-input">
        搜尋團購
      </label>
      <input
        id="group-buy-search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[#153E73] outline-none ring-0 placeholder:text-[#687386] sm:text-[15px]"
        autoComplete="off"
        style={{ height: "100%", boxShadow: "none" }}
      />
      <button
        type="button"
        aria-label="開啟篩選"
        aria-expanded={filterActive}
        onClick={() => onOpenFilters?.()}
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition",
          "bg-[#EEF8FC] text-[#153E73] hover:bg-[#d9f0f9]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79C7E8]/50",
          filterActive && "ring-2 ring-[#79C7E8]/40"
        )}
      >
        <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </form>
  );
}
