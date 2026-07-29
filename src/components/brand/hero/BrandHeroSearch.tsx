"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SEARCH_SCOPE_PATH, type SearchScope } from "@/components/brand/search/types";

export function BrandHeroSearch({
  placeholder,
  scope = "global",
}: {
  placeholder?: string | null;
  scope?: SearchScope;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    const base = SEARCH_SCOPE_PATH[scope as SearchScope] || "/search";
    router.push(`${base}?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex w-full items-center gap-2 border border-[#f2e7df] bg-white px-3 shadow-[0_8px_24px_rgba(100,57,38,0.12)]"
      style={{
        height: "56px",
        borderRadius: "18px",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: "16px",
        paddingRight: "7px",
      }}
    >
      <label className="sr-only" htmlFor="hero-search-input">
        搜尋
      </label>
      <input
        id="hero-search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || "搜尋食譜、材料、商品、課程……"}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-[#43332b] outline-none placeholder:text-[#aa9a91]"
        autoComplete="off"
        style={{ height: "100%" }}
      />
      <button
        type="submit"
        aria-label="搜尋"
        className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-[#FF6B5B] text-white transition hover:bg-[#ff8273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B5B]/50"
        style={{ width: "44px", height: "44px", flex: "0 0 44px" }}
      >
        <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </form>
  );
}

/** Compact version for mobile inside hero (same logic, smaller size) */
export function BrandHeroSearchMobile({
  placeholder,
  scope = "global",
}: {
  placeholder?: string | null;
  scope?: SearchScope;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    const base = SEARCH_SCOPE_PATH[scope as SearchScope] || "/search";
    router.push(`${base}?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex w-full items-center gap-2 border border-[#f2e7df] bg-white shadow-[0_8px_24px_rgba(100,57,38,0.12)] md:hidden"
      style={{
        height: "46px",
        borderRadius: "14px",
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "12px",
        paddingRight: "5px",
      }}
    >
      <label className="sr-only" htmlFor="hero-search-input-mobile">
        搜尋
      </label>
      <input
        id="hero-search-input-mobile"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || "搜尋食譜、材料、商品……"}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#43332b] outline-none placeholder:text-[#aa9a91]"
        autoComplete="off"
        style={{ height: "100%" }}
      />
      <button
        type="submit"
        aria-label="搜尋"
        className="inline-flex shrink-0 items-center justify-center rounded-[11px] bg-[#FF6B5B] text-white transition hover:bg-[#ff8273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B5B]/50"
        style={{ width: "38px", height: "38px", flex: "0 0 38px" }}
      >
        <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
    </form>
  );
}
