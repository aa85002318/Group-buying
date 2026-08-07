/** Store Ops V2 helpers — Product Master remains `products`; ops center on batches. */

export type StoreResource =
  | "inventory"
  | "batches"
  | "anomalies"
  | "returns"
  | "disposals"
  | "reservations"
  | "stocktakes";

export const STORE_RESOURCE_TABLE: Record<StoreResource, string> = {
  inventory: "store_inventory",
  batches: "store_batches",
  anomalies: "store_anomalies",
  returns: "store_returns",
  disposals: "store_disposals",
  reservations: "store_reservations",
  stocktakes: "store_stocktakes",
};

export const STORE_QUICK_ACTIONS = [
  { href: "/admin/store/pos?type=order", label: "商品訂購", icon: "pos" },
  { href: "/admin/store/pos?type=price_inquiry", label: "價格詢問", icon: "orders" },
  { href: "/admin/store/demand?type=restock", label: "分店需求", icon: "stock" },
  { href: "/admin/store/entry?type=issue", label: "商品異常", icon: "issue" },
  { href: "/admin/store/entry?type=disposal", label: "商品報廢", icon: "disposal" },
  { href: "/admin/store/entry?type=return", label: "商品退貨", icon: "issue" },
  { href: "/admin/store/entry?type=repair", label: "商品報修", icon: "repair" },
  { href: "/admin/store#messages", label: "工作留言", icon: "pickup" },
] as const;

/** Phase B: field entry types — shared form at /admin/store/entry */
export const STORE_QUICK_ENTRY_TYPES = [
  { id: "issue", label: "商品異常", href: "/admin/store/entry?type=issue" },
  { id: "disposal", label: "商品報廢", href: "/admin/store/entry?type=disposal" },
  { id: "return", label: "商品退貨", href: "/admin/store/entry?type=return" },
  { id: "repair", label: "商品報修", href: "/admin/store/entry?type=repair" },
  { id: "special", label: "客人特殊需求", href: "/admin/store/entry?type=special" },
  { id: "message", label: "留言", href: "/admin/store/entry?type=message" },
] as const;

export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(expiry: string | null | undefined, from = todayISO()): number | null {
  if (!expiry) return null;
  const a = new Date(from + "T00:00:00");
  const b = new Date(expiry + "T00:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (24 * 3600 * 1000));
}

export function expiryStatusLabel(days: number | null): string {
  if (days == null) return "無效期";
  if (days < 0) return "已過期";
  if (days <= 7) return "7天內";
  if (days <= 14) return "14天內";
  if (days <= 30) return "即將到期";
  return "正常";
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 11) return "早安";
  if (hour < 17) return "午安";
  return "晚安";
}

export type MovementType =
  | "receive"
  | "return"
  | "disposal"
  | "stocktake"
  | "adjust"
  | "sale"
  | "transfer";
