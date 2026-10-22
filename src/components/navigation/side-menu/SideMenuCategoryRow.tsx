"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SideMenuCategory } from "@/types/navigation";

/**
 * 側邊選單的分類列。
 *
 * compact：把每列從 72px 壓到 48px、圖示 48→32px、關掉說明文字。
 * 分類數量多的時候（實際資料有 26 個大分類、147 個小分類），
 * 72px 一列會讓清單高到要捲很久——同一個螢幕高度下 compact 可以多看一倍以上。
 * 名稱一律單行、超出以 … 截斷，這樣每列高度固定，清單不會因為某個長名稱而跳動。
 */
export function SideMenuCategoryRow({
  category,
  onClick,
  hideDescription,
  compact = false,
}: {
  category: SideMenuCategory;
  onClick: () => void;
  hideDescription?: boolean;
  compact?: boolean;
}) {
  const showDescription = !compact && !hideDescription && Boolean(category.description);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-[#F0ECE5] px-1 text-left transition duration-100 last:border-b-0 active:scale-[0.985] active:bg-[#FFF5CC]",
        compact ? "min-h-12 py-2" : "min-h-[72px] py-3"
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF5CC]",
          compact ? "h-8 w-8" : "h-12 w-12"
        )}
      >
        {category.imageUrl || category.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.imageUrl || category.iconUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={cn("font-bold text-[#153E73]", compact ? "text-xs" : "text-sm")}
          >
            {category.name.slice(0, 1)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            // truncate：長名稱不折行，每列高度固定
            "block truncate font-semibold text-[#153E73]",
            compact ? "text-[15px]" : "text-[17px]"
          )}
        >
          {category.name}
        </span>
        {showDescription ? (
          <span className="mt-0.5 block truncate text-[13px] text-[#687386] max-[374px]:hidden">
            {category.description}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className={cn("shrink-0 text-[#153E73]", compact ? "h-4 w-4" : "h-5 w-5")}
      />
    </button>
  );
}
