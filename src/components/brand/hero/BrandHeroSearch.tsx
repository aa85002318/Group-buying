"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
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
      className="flex w-full items-center gap-3 border border-[#E9EDF2] bg-white"
      style={{
        height: "clamp(56px, 8vw, 64px)",
        borderRadius: "999px",
        paddingLeft: "18px",
        paddingRight: "10px",
        boxShadow: "0 12px 30px rgba(21, 62, 115, 0.08)",
      }}
    >
      <Search
        className="h-5 w-5 shrink-0 text-[#8791A3]"
        strokeWidth={1.75}
        aria-hidden
      />
      <label className="sr-only" htmlFor="hero-search-input">
        搜尋
      </label>
      <input
        id="hero-search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || "今天想做什麼？搜尋食譜、商品、團購、生鮮…"}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-[#153E73] outline-none placeholder:text-[#8791A3]"
        autoComplete="off"
        style={{ height: "100%" }}
      />
      <button
        type="submit"
        aria-label="智慧搜尋"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#EEF8FC] text-[#79C7E8] transition hover:bg-[#d9f0f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79C7E8]/50"
        style={{ width: "44px", height: "44px", flex: "0 0 44px" }}
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </form>
  );
}
