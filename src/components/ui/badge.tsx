import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const variants: Record<string, string> = {
  default: "bg-tag-bg text-tag-text",
  tag: "bg-tag-bg text-tag-text",
  countdown: "bg-tag-bg text-countdown",
  success: "bg-green-100 text-green-800",
  warning: "bg-tag-bg text-tag-text",
  danger: "bg-red-100 text-red-800",
  primary: "bg-tag-bg text-tag-text",
  secondary: "bg-muted text-muted-foreground",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
