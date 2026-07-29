"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SEARCH_SCOPE_PATH,
  type BrandSearchProps,
  type SearchScope,
} from "./types";

export function BrandSearch({
  scope = "global",
  placeholder = "搜尋商品、食譜、課程…",
  defaultValue = "",
  className,
  floating = false,
  onSubmitQuery,
}: BrandSearchProps) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    onSubmitQuery?.(query);
    if (!query) return;
    const base = SEARCH_SCOPE_PATH[scope as SearchScope] || "/search";
    router.push(`${base}?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative z-10 flex items-center gap-2 border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 shadow-[var(--shadow-sm)]",
        floating && "-mt-[var(--brand-search-float)]",
        className
      )}
      style={{
        height: "var(--brand-search-height)",
        borderRadius: "var(--brand-search-radius)",
      }}
      role="search"
    >
      <label className="sr-only" htmlFor="brand-search-input">
        搜尋
      </label>
      <input
        id="brand-search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[var(--font-size-body)] text-[var(--brand-text-primary)] placeholder:text-[var(--brand-text-muted)] focus:outline-none"
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label="搜尋"
        className="brand-focus-ring inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[var(--brand-text-inverse)] transition hover:bg-[var(--brand-primary-hover)]"
        style={{
          width: "var(--brand-search-btn)",
          height: "var(--brand-search-btn)",
        }}
      >
        <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </form>
  );
}
