"use client";

import {
  INSPIRATION_WALL_CATEGORIES,
  type InspirationCategoryItem,
} from "@/lib/shop/inspiration-wall";
import { cn } from "@/lib/utils";

export function InspirationCategoryMenu({
  categories = INSPIRATION_WALL_CATEGORIES,
  activeSlug,
  onChange,
  loading,
}: {
  categories?: InspirationCategoryItem[];
  activeSlug: string;
  onChange: (slug: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden md:gap-5" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex w-[58px] shrink-0 flex-col items-center gap-2 md:w-[68px]">
            <div className="h-[58px] w-[58px] animate-pulse rounded-full bg-[#FFF3C4] md:h-[68px] md:w-[68px]" />
            <div className="h-3 w-10 animate-pulse rounded bg-[#FFF3C4]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="shop-inspiration-cats flex gap-3 overflow-x-auto pb-1 md:gap-5 md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="靈感分類"
    >
      {categories.map((cat) => {
        const active = cat.slug === activeSlug;
        const img = cat.image_url?.trim();
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(cat.slug)}
            className="flex w-[58px] shrink-0 flex-col items-center gap-1.5 md:w-[68px]"
          >
            <span
              className={cn(
                "relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full text-[22px] transition duration-200 md:h-[68px] md:w-[68px] md:text-[26px]",
                active
                  ? "bg-[#FFD84D] text-[#153E73] shadow-[0_6px_16px_rgba(255,216,77,0.45)]"
                  : "bg-[#FFF7E3] text-[#153E73]"
              )}
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="h-full w-full object-cover" />
              ) : (
                cat.icon
              )}
            </span>
            <span
              className={cn(
                "text-center text-[11px] font-semibold leading-tight md:text-[12px]",
                active ? "text-[#153E73]" : "text-[#153E73]/80"
              )}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
