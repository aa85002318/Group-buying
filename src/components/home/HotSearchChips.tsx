"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type HotSearchKeyword,
  hotSearchHref,
} from "@/lib/home/hot-search";
import type { PopularCategoryItem } from "@/components/home/PopularCategories";

type HotSearchChipsProps = {
  title?: string;
  keywords: HotSearchKeyword[];
  categoryFallback?: PopularCategoryItem[];
  loading?: boolean;
  className?: string;
};

export function HotSearchChips({
  title = "熱門搜尋",
  keywords,
  categoryFallback = [],
  loading,
  className,
}: HotSearchChipsProps) {
  if (loading) {
    return (
      <section className={cn("space-y-2 bg-background", className)} aria-busy>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-brand-caramel">
          <Flame className="h-4 w-4 text-brand-primary" aria-hidden />
          {title}
        </h2>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="home-skeleton h-9 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </section>
    );
  }

  const chips =
    keywords.length > 0
      ? keywords.map((k) => ({
          key: k.id,
          label: `#${k.label}`,
          href: hotSearchHref(k.label),
        }))
      : categoryFallback.map((c) => ({
          key: c.id,
          label: c.name,
          href: c.href,
        }));

  if (chips.length === 0) return null;

  return (
    <section className={cn("space-y-2 bg-background", className)} aria-label={title}>
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-brand-caramel">
        <Flame className="h-4 w-4 text-brand-primary" aria-hidden />
        {title}
      </h2>
      <div className="h-scroll max-h-12 overflow-y-hidden md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max max-w-none flex-nowrap gap-2 md:flex-wrap">
          {chips.map((chip) => (
            <li key={chip.key} className="shrink-0">
              <Link
                href={chip.href}
                className={cn(
                  "inline-flex items-center whitespace-nowrap rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-brand-caramel transition duration-200",
                  "hover:border-brand-yellow hover:bg-surface-yellow",
                  "active:border-brand-primary active:bg-surface-coral active:text-brand-primary"
                )}
              >
                {chip.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
