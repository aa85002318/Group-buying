"use client";

import { useRef } from "react";
import { ChevronDown, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IngredientShopCategoryTab } from "@/types/home-product-section";
import { APP_ROUTES } from "@/lib/site-links";

type ProductCategoryTabsProps = {
  tabs: IngredientShopCategoryTab[];
  activeId: string;
  onChange: (id: string) => void;
  moreOptionsHref?: string;
};

export function ProductCategoryTabs({
  tabs,
  activeId,
  onChange,
  moreOptionsHref = APP_ROUTES.bakingMaterials,
}: ProductCategoryTabsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="ingredient-shop-tabs flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="商品分類"
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-2xl border px-[18px] text-sm font-semibold transition md:h-12 md:px-6",
                selected
                  ? "border-transparent bg-[#FFD454] text-[#153E73] shadow-[0_6px_18px_rgba(21,62,115,0.08)]"
                  : "border-[#E9EDF2] bg-white text-[#153E73] hover:border-[#d5dde6]"
              )}
            >
              {tab.icon ? <span aria-hidden>{tab.icon}</span> : null}
              {tab.label}
            </button>
          );
        })}
        <Link
          href={moreOptionsHref}
          className="inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-2xl border border-[#E9EDF2] bg-white px-[18px] text-sm font-semibold text-[#153E73] transition hover:border-[#d5dde6] md:h-12 md:px-6"
        >
          <Filter className="h-4 w-4" aria-hidden />
          更多選項
          <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
