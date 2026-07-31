"use client";

import { Search } from "lucide-react";

export function CategorySearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="home-category-search">
      <Search className="h-4 w-4 shrink-0 text-[#687386]" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">搜尋商品分類</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜尋商品分類"
        autoComplete="off"
        className="home-category-search__input"
      />
    </label>
  );
}
