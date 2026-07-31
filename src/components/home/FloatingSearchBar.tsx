"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { SEARCH_SCOPE_PATH, type SearchScope } from "@/components/brand/search/types";

export type HeroSearchBarHandle = {
  focus: () => void;
};

/** Floating search — keeps existing search navigation behavior. */
export const FloatingSearchBar = forwardRef<
  HeroSearchBarHandle,
  {
    placeholder?: string | null;
    scope?: SearchScope | string;
  }
>(function FloatingSearchBar({ placeholder, scope = "global" }, ref) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 280);
    },
  }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    const base = SEARCH_SCOPE_PATH[(scope as SearchScope) || "global"] || "/search";
    router.push(`${base}?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      role="search"
      className="relative z-10 mx-auto flex h-[54px] w-full max-w-[1280px] -mt-[26px] min-w-0 items-center gap-2 border border-[#E9EDF2] bg-white px-4 pr-2.5 md:h-16 md:-mt-[38px] md:gap-3 md:px-[18px] md:pr-2.5"
      style={{
        borderRadius: "999px",
        boxShadow:
          "0 12px 30px rgba(21, 62, 115, 0.10), 0 3px 8px rgba(21, 62, 115, 0.04)",
      }}
    >
      <Search className="h-5 w-5 shrink-0 text-[#153E73]" strokeWidth={1.75} aria-hidden />
      <label className="sr-only" htmlFor="home-hero-search-input">
        搜尋
      </label>
      <input
        ref={inputRef}
        id="home-hero-search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || "今天想做什麼？搜尋食譜、商品…"}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-[#153E73] outline-none placeholder:text-[#687386] sm:text-[15px]"
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
});

/** Alias per homepage hero naming. */
export { FloatingSearchBar as HeroSearchBar };
