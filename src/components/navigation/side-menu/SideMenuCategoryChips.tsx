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
    <div className="overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max snap-x snap-mandatory gap-2 pb-1">
        {categories.map((cat) => {
          const selected = cat.id === selectedId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat)}
              className={cn(
                "inline-flex h-10 shrink-0 snap-start items-center rounded-full px-4 text-sm font-semibold transition duration-[120ms]",
                "active:scale-[0.98]",
                selected
                  ? "bg-[#FFD454] text-[#153E73]"
                  : "border border-[#E5E7EB] bg-white text-[#153E73]"
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
