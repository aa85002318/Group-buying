import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ChipTone = "primary" | "secondary" | "mint" | "blue" | "yellow" | "gray" | "warning" | "groupBuy";

const tones: Record<ChipTone, string> = {
  primary: "bg-primary-soft text-primary",
  secondary: "bg-groupBuy-soft text-groupBuy",
  mint: "bg-success-soft text-success",
  blue: "bg-info-soft text-info",
  yellow: "bg-warning-soft text-foreground",
  gray: "bg-surface-soft text-foreground-secondary",
  warning: "bg-warning-soft text-foreground",
  groupBuy: "bg-groupBuy-soft text-groupBuy",
};

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ChipTone;
  active?: boolean;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, tone = "primary", active, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center rounded-full px-3.5 text-xs font-bold transition duration-250 ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "bg-primary text-white shadow-brand" : tones[tone],
        className
      )}
      {...props}
    />
  )
);
Chip.displayName = "Chip";
