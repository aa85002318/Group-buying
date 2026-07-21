"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { type HotSearchKeyword, hotSearchHref } from "@/lib/home/hot-search";

type HotSearchChipsProps = {
  title?: string;
  keywords: HotSearchKeyword[];
  loading?: boolean;
  className?: string;
};

/** Single-line popular search chips between search and hero. */
export function HotSearchChips({
  title = "熱門搜尋",
  keywords,
  loading,
  className,
}: HotSearchChipsProps) {
  if (loading) {
    return (
      <div className={cn("flex h-10 items-center gap-2", className)} aria-busy>
        <div className="home-skeleton h-7 w-20 shrink-0 rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="home-skeleton h-7 w-16 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  if (keywords.length === 0) return null;

  return (
    <section
      aria-label={title}
      className={cn("flex h-10 min-h-[40px] items-center gap-2 overflow-hidden", className)}
    >
      <h2 className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-caramel">
        <Flame className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
        {title}
      </h2>
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain scrollbar-none">
        <ul className="flex w-max flex-nowrap items-center gap-1.5 whitespace-nowrap">
          {keywords.map((k) => (
            <li key={k.id} className="shrink-0">
              <Link
                href={hotSearchHref(k.label)}
                className="home-hot-chip inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium"
              >
                #{k.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
