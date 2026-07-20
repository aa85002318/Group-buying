import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const variants: Record<string, string> = {
  default: "bg-tag-bg text-tag-text",
  tag: "bg-tag-bg text-tag-text",
  new: "bg-[#C45CDB] text-white shadow-sticker",
  hot: "bg-brand-gradient text-white shadow-sticker",
  live: "bg-[#E53935] text-white shadow-sticker animate-live",
  preorder: "bg-[#3A86FF] text-white shadow-sticker",
  limited: "bg-promo-gradient text-brand-ink shadow-sticker",
  countdown: "bg-[#FFF0F4] text-countdown",
  success: "bg-[#E8F8EE] text-[#31B057]",
  warning: "bg-[#FFF4E5] text-[#FF9F1C]",
  danger: "bg-[#FDECEA] text-[#E53935]",
  primary: "bg-tag-bg text-tag-text",
  secondary: "bg-muted text-muted-foreground",
  mint: "bg-[#E6F8F3] text-[#4CC9A6]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
