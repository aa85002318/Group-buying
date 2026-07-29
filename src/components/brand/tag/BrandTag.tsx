"use client";

import { cn } from "@/lib/utils";
import type { BrandTagProps, BrandTagVariant } from "./types";

const VARIANT_CLASS: Record<BrandTagVariant, string> = {
  default:
    "bg-[var(--brand-surface-muted)] text-[var(--brand-text-secondary)] border-[var(--brand-border)]",
  popular:
    "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)]",
  new: "bg-[color-mix(in_srgb,var(--brand-info)_22%,white)] text-[var(--brand-text-primary)] border-[color-mix(in_srgb,var(--brand-info)_35%,transparent)]",
  sale: "bg-[var(--brand-primary)] text-[var(--brand-text-inverse)] border-transparent",
  limited:
    "bg-[color-mix(in_srgb,var(--brand-warning)_28%,white)] text-[var(--brand-text-primary)] border-[color-mix(in_srgb,var(--brand-warning)_40%,transparent)]",
  success:
    "bg-[color-mix(in_srgb,var(--brand-success)_22%,white)] text-[var(--brand-text-primary)] border-[color-mix(in_srgb,var(--brand-success)_35%,transparent)]",
  warning:
    "bg-[color-mix(in_srgb,var(--brand-accent)_45%,white)] text-[var(--brand-text-primary)] border-[var(--brand-accent)]",
};

export function BrandTag({
  variant = "default",
  className,
  children,
  as = "span",
  onClick,
}: BrandTagProps) {
  const Comp = as;
  return (
    <Comp
      type={as === "button" ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-[11px] font-bold leading-5",
        VARIANT_CLASS[variant],
        as === "button" && "brand-focus-ring cursor-pointer",
        className
      )}
    >
      {children}
    </Comp>
  );
}
