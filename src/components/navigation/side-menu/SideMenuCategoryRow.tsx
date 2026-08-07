"use client";

import { ChevronRight } from "lucide-react";
import type { SideMenuCategory } from "@/types/navigation";

export function SideMenuCategoryRow({
  category,
  onClick,
  hideDescription,
}: {
  category: SideMenuCategory;
  onClick: () => void;
  hideDescription?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 border-b border-[#F0ECE5] px-1 py-3 text-left transition duration-100 last:border-b-0 active:scale-[0.985] active:bg-[#FFF5CC]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF5CC]">
        {category.imageUrl || category.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.imageUrl || category.iconUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-[#153E73]">
            {category.name.slice(0, 1)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold text-[#153E73]">
          {category.name}
        </span>
        {!hideDescription && category.description ? (
          <span className="mt-0.5 block text-[13px] text-[#687386] max-[374px]:hidden">
            {category.description}
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#153E73]" />
    </button>
  );
}
