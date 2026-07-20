/**
 * Frontend Visual System 2.0 — semantic theme helpers
 * Prefer CSS vars / Tailwind semantic classes in components.
 */

export const theme = {
  primary: "var(--primary)",
  primaryHover: "var(--primary-hover)",
  groupBuy: "var(--group-buy)",
  groupBuyHover: "var(--group-buy-hover)",
  background: "var(--background)",
  surface: "var(--surface)",
  surfaceSoft: "var(--surface-soft)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  border: "var(--border)",
  price: "var(--price)",
  success: "var(--success)",
  warning: "var(--warning)",
  error: "var(--error)",
  info: "var(--info)",
  disabled: "var(--disabled)",
} as const;

export type ThemeColorKey = keyof typeof theme;

/** Product / content badge intent → Tailwind class pairs */
export const badgeToneClass: Record<
  "new" | "groupBuy" | "hot" | "preorder" | "inStock" | "closing" | "soldOut" | "live" | "success" | "warning" | "error" | "info" | "disabled" | "primary",
  string
> = {
  new: "bg-primary text-white",
  groupBuy: "bg-groupBuy text-white",
  hot: "bg-error text-white",
  preorder: "bg-warning text-foreground",
  inStock: "bg-success text-white",
  closing: "bg-error text-white",
  soldOut: "bg-disabled text-white",
  live: "bg-error text-white",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-foreground",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
  disabled: "bg-disabled/20 text-disabled",
  primary: "bg-primary/15 text-primary",
};
