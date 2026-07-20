import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode, forwardRef } from "react";

const toneClass = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-foreground",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
  disabled: "bg-disabled/20 text-disabled",
  primary: "bg-primary-soft text-primary",
  groupBuy: "bg-groupBuy-soft text-groupBuy",
} as const;

export type StatusBadgeTone = keyof typeof toneClass;

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
  label: string;
  /** Optional icon element — status must not rely on color alone */
  icon?: ReactNode;
}

/**
 * Storefront status chip (Visual System 2.0).
 * Admin keeps its own `components/admin/StatusBadge`.
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, tone = "info", label, icon, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        toneClass[tone],
        className
      )}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </span>
  )
);
StatusBadge.displayName = "StatusBadge";
