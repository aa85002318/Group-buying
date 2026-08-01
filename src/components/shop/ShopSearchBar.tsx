"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, ScanLine, Search, Sparkles } from "lucide-react";

/**
 * Shop search bar — frosted floating pill overlapping hero (App home style).
 */
export function ShopSearchBar({
  placeholder = "搜尋商品、品牌、材料、食譜……",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const goSearch = () => {
    const query = q.trim();
    if (!query) return;
    router.push(`/shop/search?q=${encodeURIComponent(query)}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    goSearch();
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="shop-search-bar"
      aria-label="商城搜尋"
    >
      <button
        type="submit"
        className="shop-search-bar__icon-btn"
        aria-label="搜尋"
      >
        <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>

      <label className="sr-only" htmlFor="shop-search-input">
        搜尋商品
      </label>
      <input
        id="shop-search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="shop-search-bar__input"
        autoComplete="off"
      />

      <div className="shop-search-bar__actions">
        <button
          type="button"
          className="shop-search-bar__icon-btn"
          aria-label="掃描搜尋（即將推出）"
          onClick={() => goSearch()}
        >
          <ScanLine className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          className="shop-search-bar__icon-btn"
          aria-label="語音搜尋（即將推出）"
          onClick={() => goSearch()}
        >
          <Mic className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          className="shop-search-bar__ai-btn"
          aria-label="AI 智慧搜尋"
          onClick={() => {
            const query = q.trim();
            if (query) {
              router.push(`/ai?q=${encodeURIComponent(query)}`);
            } else {
              router.push("/ai");
            }
          }}
        >
          <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </form>
  );
}
