"use client";

import { cn } from "@/lib/utils";
import type { SideMenuCategory } from "@/types/navigation";

export function SideMenuCategoryChips({
  categories,
  selectedId,
  onSelect,
}: {
  categories: SideMenuCategory[];
  selectedId?: string | null;
  onSelect: (cat: SideMenuCategory) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2 pb-1">
        {categories.map((cat) => {
          const selected = cat.id === selectedId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition",
                selected
                  ? "bg-[#FFD454] text-[#153E73]"
                  : "border border-[#E8E1D7] bg-white text-[#153E73]"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
