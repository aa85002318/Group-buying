import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ChipTone = "primary" | "secondary" | "mint" | "blue" | "yellow" | "gray" | "warning";

const tones: Record<ChipTone, string> = {
  primary: "bg-[#FFF0F4] text-[#E9285C]",
  secondary: "bg-[#FFF3EC] text-[#FF7A45]",
  mint: "bg-[#E6F8F3] text-[#4CC9A6]",
  blue: "bg-[#EAF2FF] text-[#3A86FF]",
  yellow: "bg-[#FFF8E0] text-[#B8860B]",
  gray: "bg-[#F5F5F5] text-[#757575]",
  warning: "bg-[#FFF4E5] text-[#FF9F1C]",
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
        "inline-flex min-h-9 items-center rounded-full px-3.5 text-xs font-bold transition duration-250 ease-brand",
        active ? "bg-brand-gradient text-white shadow-brand" : tones[tone],
        className
      )}
      {...props}
    />
  )
);
Chip.displayName = "Chip";
