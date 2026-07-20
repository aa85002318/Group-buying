import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const variants: Record<string, string> = {
  default: "bg-surface-soft text-primary",
  tag: "bg-surface-soft text-primary",
  new: "bg-primary text-white shadow-sticker",
  hot: "bg-error text-white shadow-sticker",
  live: "bg-error text-white shadow-sticker animate-live",
  preorder: "bg-warning text-foreground shadow-sticker",
  limited: "bg-groupBuy text-white shadow-sticker",
  countdown: "bg-error-soft text-error",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-foreground",
  danger: "bg-error-soft text-error",
  primary: "bg-primary-soft text-primary",
  secondary: "bg-surface-soft text-foreground-secondary",
  mint: "bg-success-soft text-success",
  groupBuy: "bg-groupBuy text-white shadow-sticker",
  disabled: "bg-disabled/20 text-disabled",
  info: "bg-info-soft text-info",
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
