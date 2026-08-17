"use client";

import Link from "next/link";
import type { ShopPopularKeyword } from "@/lib/shop/home-settings";

export function ShopPopularKeywords({
  keywords,
}: {
  keywords: ShopPopularKeyword[];
}) {
  const visible = keywords.filter((k) => k.is_active && k.keyword.trim()).slice(0, 5);
  if (!visible.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="熱門搜尋">
      <span className="text-[12px] font-semibold text-[#153E73]/70">熱門搜尋</span>
      {visible.map((k) => (
        <Link
          key={k.id}
          href={k.url || `/shop/search?q=${encodeURIComponent(k.keyword)}`}
          className="rounded-full border border-white/50 bg-white/55 px-2.5 py-1 text-[12px] font-medium text-[#153E73] transition hover:bg-white/80"
        >
          {k.keyword}
        </Link>
      ))}
    </div>
  );
}
