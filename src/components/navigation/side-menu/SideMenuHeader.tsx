"use client";

import { ArrowLeft, Search, X } from "lucide-react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import { cn } from "@/lib/utils";

export function SideMenuHeader({
  title,
  showLogo,
  showBack,
  onBack,
  onSearch,
  onClose,
  className,
}: {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-1 border-b border-[#F0ECE5] px-3",
        className
      )}
    >
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#153E73] hover:bg-[#FFF5CC]"
          aria-label="返回上一層"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        {showLogo ? (
          <ChimeidiyLogo variant="sideMenu" href="/" />
        ) : (
          <p className="truncate px-1 text-[20px] font-bold text-[#153E73]">{title}</p>
        )}
      </div>

      {onSearch ? (
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#153E73] hover:bg-[#FFF5CC]"
          aria-label="搜尋"
        >
          <Search className="h-5 w-5" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#153E73] hover:bg-[#FFF5CC]"
        aria-label="關閉選單"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
