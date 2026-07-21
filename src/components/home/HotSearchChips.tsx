"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type HotSearchKeyword,
  hotSearchHref,
} from "@/lib/home/hot-search";
import type { PopularCategoryItem } from "@/components/home/PopularCategories";

type HotSearchChipsProps = {
  title?: string;
  keywords: HotSearchKeyword[];
  /** Fallback when CMS/defaults empty — show popular categories as chips */
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
      <section className={cn("space-y-2", className)} aria-busy>
        <h2 className="text-sm font-semibold text-caramel">{title}</h2>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
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
    <section className={cn("space-y-2", className)} aria-label={title}>
      <h2 className="text-sm font-semibold text-caramel">{title}</h2>
      <div className="h-scroll max-h-[5.5rem] overflow-y-hidden md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max max-w-none flex-nowrap gap-2 md:flex-wrap">
          {chips.map((chip) => (
            <li key={chip.key} className="shrink-0">
              <Link
                href={chip.href}
                className={cn(
                  "inline-flex items-center rounded-full border border-border-soft bg-surface px-3 py-2 text-sm font-medium text-caramel shadow-sm transition",
                  "hover:border-primary hover:bg-primary-soft",
                  "active:border-primary active:bg-primary-soft"
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
