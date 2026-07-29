"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type SearchSuggestionGroup = {
  type: "products" | "recipes" | "courses" | "group_buy" | "articles";
  label: string;
  items: Array<{ id: string; title: string; href: string }>;
};

const TYPE_LABEL: Record<SearchSuggestionGroup["type"], string> = {
  products: "商品",
  recipes: "食譜",
  courses: "課程",
  group_buy: "團購",
  articles: "文章",
};

export function SearchSuggestions({
  groups,
  className,
  maxPerGroup = 4,
}: {
  groups: SearchSuggestionGroup[];
  className?: string;
  maxPerGroup?: number;
}) {
  const visible = groups.filter((g) => g.items.length > 0);
  if (!visible.length) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-[var(--shadow-md)]",
        className
      )}
      role="listbox"
      aria-label="搜尋建議"
    >
      {visible.map((group) => (
        <div key={group.type} className="border-b border-[var(--brand-border)] last:border-b-0">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            {group.label || TYPE_LABEL[group.type]}
          </p>
          <ul>
            {group.items.slice(0, maxPerGroup).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="brand-focus-ring block px-3 py-2 text-sm text-[var(--brand-text-primary)] hover:bg-[var(--brand-background-soft)]"
                  role="option"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
