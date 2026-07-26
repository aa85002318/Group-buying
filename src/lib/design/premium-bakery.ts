/**
 * CHIMEIDIY Premium Bakery Design System — TypeScript token map
 * Prefer CSS variables in UI; use these for charts / canvas / non-CSS contexts.
 */

export const brandColors = {
  primary: "#E86C5C",
  primaryHover: "#D95D4F",
  secondary: "#B56A45",
  premium: "#F6C65B",
  background: "#FFFDF9",
  surface: "#F8E6D7",
  card: "#FFFFFF",
  border: "#F3E5D9",
  text: "#5E4035",
  textSecondary: "#8B6B5A",
  textMuted: "#A98A7A",
} as const;

export const statusColors = {
  success: "#72B67A",
  warning: "#E8B04A",
  error: "#D9534F",
  info: "#79A9E8",
} as const;

export const moduleColors = {
  materials: "#B56A45",
  groupBuy: "#E86C5C",
  recipe: "#E8B04A",
  ai: "#8F74D8",
  video: "#79A9E8",
  store: "#72B67A",
  course: "#F39C6B",
  news: "#5BA8D8",
} as const;

export const expiryColors = {
  ok: "#72B67A",
  within30: "#E8B04A",
  within14: "#F39C6B",
  within7: "#E86C5C",
  expired: "#C13F36",
  done: "#B5B5B5",
} as const;

export const chartColors = {
  products: "#B56A45",
  batches: "#79A9E8",
  expiring: "#E8B04A",
  expired: "#D9534F",
  disposal: "#C13F36",
  anomaly: "#8F74D8",
  returns: "#5BA8D8",
} as const;

export const aiColors = {
  primary: "#8F74D8",
  background: "#F7F3FF",
  cta: "#E86C5C",
} as const;

export const memberColors = {
  standard: "#B56A45",
  vip: "#F6C65B",
  progressFrom: "#F6C65B",
  progressTo: "#E8B04A",
} as const;

/** Map days-until-expiry → Store Ops status color */
export function expiryColorForDays(days: number | null): string {
  if (days == null) return expiryColors.done;
  if (days < 0) return expiryColors.expired;
  if (days <= 7) return expiryColors.within7;
  if (days <= 14) return expiryColors.within14;
  if (days <= 30) return expiryColors.within30;
  return expiryColors.ok;
}
