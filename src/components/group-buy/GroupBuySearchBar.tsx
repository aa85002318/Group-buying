"use client";

import { FormEvent, useState } from "react";
import { Search, Sparkles } from "lucide-react";

/**
 * Group-buy hub search — same chrome as shop / homepage FloatingSearchBar.
 * `seam` enables negative-margin overlap under the hero blur boundary.
 */
export function GroupBuySearchBar({
  placeholder = "搜尋團購活動…",
  seam = true,
  defaultValue = "",
  onSearch,
}: {
  placeholder?: string;
  seam?: boolean;
  defaultValue?: string;
  onSearch?: (query: string) => void;
}) {
  const [q, setQ] = useState(defaultValue);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    onSearch?.(query);
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="團購搜尋"
      className={
        seam
          ? "relative z-10 mx-auto flex h-[54px] w-full max-w-[1280px] -mt-[26px] min-w-0 items-center gap-2 border border-[#E9EDF2] bg-white px-4 pr-2.5 md:h-16 md:-mt-[38px] md:gap-3 md:px-[18px] md:pr-2.5"
          : "relative z-10 mx-auto flex h-[54px] w-full max-w-[1280px] min-w-0 items-center gap-2 border border-[#E9EDF2] bg-white px-4 pr-2.5 md:h-16 md:gap-3 md:px-[18px] md:pr-2.5"
      }
      style={{
        borderRadius: "999px",
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
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-[#153E73] outline-none placeholder:text-[#687386] sm:text-[15px]"
        autoComplete="off"
        style={{ height: "100%" }}
      />
      <button
        type="submit"
        aria-label="搜尋團購"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#EEF8FC] text-[#79C7E8] transition hover:bg-[#d9f0f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79C7E8]/50"
        style={{ width: "44px", height: "44px", flex: "0 0 44px" }}
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </form>
  );
}
