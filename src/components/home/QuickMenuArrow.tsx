"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickMenuArrowProps = {
  direction: "left" | "right";
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export function QuickMenuArrow({
  direction,
  disabled,
  onClick,
  className,
}: QuickMenuArrowProps) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  const label =
    direction === "left" ? "向左瀏覽快捷選單" : "向右瀏覽快捷選單";

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center",
        "h-8 w-8 rounded-full border border-border bg-surface text-brand-caramel",
        "shadow-[0_2px_8px_rgba(107,63,36,.08)] transition duration-180",
        "hover:border-peach hover:bg-primary-soft hover:text-brand-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:pointer-events-none disabled:opacity-35",
        "sm:h-[38px] sm:w-[38px]",
        direction === "left" ? "left-1.5 sm:left-2" : "right-1.5 sm:right-2",
        className
      )}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
    </button>
  );
}
