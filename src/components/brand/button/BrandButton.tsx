"use client";

import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { BrandButtonProps } from "./types";

const brandButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold transition-[transform,background-color,box-shadow,opacity] focus-visible:outline-none brand-focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--brand-border-strong)] disabled:text-[var(--brand-text-muted)] disabled:shadow-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-primary)] text-[var(--brand-text-inverse)] shadow-[var(--shadow-sm)] hover:bg-[var(--brand-primary-hover)]",
        secondary:
          "bg-[var(--brand-primary-soft)] text-[var(--brand-text-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary-soft)_80%,var(--brand-primary)_20%)]",
        outline:
          "border-2 border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]",
        ghost:
          "bg-transparent text-[var(--brand-text-primary)] hover:bg-[var(--brand-background-soft)]",
        danger:
          "bg-[var(--brand-mascot-red)] text-[var(--brand-text-inverse)] hover:opacity-90",
      },
      size: {
        sm: "h-9 min-h-9 rounded-[var(--radius-sm)] px-3 text-xs",
        md: "h-11 min-h-11 rounded-[var(--radius-md)] px-5 text-sm",
        lg: "h-12 min-h-12 rounded-[var(--radius-lg)] px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        brandButtonVariants({ variant, size }),
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
);
BrandButton.displayName = "BrandButton";

export { brandButtonVariants };
