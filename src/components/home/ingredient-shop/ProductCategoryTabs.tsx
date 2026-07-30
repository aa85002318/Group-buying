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

const tabBase =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border px-3.5 text-[13px] font-semibold transition md:h-10 md:gap-1.5 md:rounded-[14px] md:px-[18px] md:text-sm";

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
        className="ingredient-shop-tabs flex gap-2 overflow-x-auto pb-0.5 md:gap-2.5"
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
                tabBase,
                selected
                  ? "border-transparent bg-[#FFD454] text-[#153E73] shadow-[0_4px_12px_rgba(21,62,115,0.08)]"
                  : "border-[#E9EDF2] bg-white text-[#153E73] hover:border-[#d5dde6]"
              )}
            >
              {tab.icon ? (
                <span className="text-base leading-none md:text-lg" aria-hidden>
                  {tab.icon}
                </span>
              ) : null}
              {tab.label}
            </button>
          );
        })}
        <Link
          href={moreOptionsHref}
          className={cn(tabBase, "border-[#E9EDF2] bg-white text-[#153E73] hover:border-[#d5dde6]")}
        >
          <Filter className="h-4 w-4 md:h-[18px] md:w-[18px]" aria-hidden />
          更多選項
          <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
