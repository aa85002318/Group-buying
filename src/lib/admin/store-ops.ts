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
  { href: "/admin/orders", label: "新訂單", icon: "orders" },
  { href: "/admin/pickup", label: "取貨", icon: "pickup" },
  { href: "/admin/store/issues?new=1", label: "商品異常", icon: "issue" },
  { href: "/admin/store/disposals?new=1", label: "商品報廢", icon: "disposal" },
  { href: "/admin/store/returns?new=1", label: "商品退貨", icon: "return" },
  { href: "/admin/store/issues?new=1&type=repair", label: "商品報修", icon: "repair" },
  { href: "/admin/store#quick-entry", label: "工作紀錄", icon: "log" },
  { href: "/admin/store/inventory", label: "庫存", icon: "stock" },
] as const;

/** Phase A: field entry types — deep-link to existing forms where available. */
export const STORE_QUICK_ENTRY_TYPES = [
  { id: "issue", label: "商品異常", href: "/admin/store/issues?new=1" },
  { id: "disposal", label: "商品報廢", href: "/admin/store/disposals?new=1" },
  { id: "return", label: "商品退貨", href: "/admin/store/returns?new=1" },
  { id: "repair", label: "商品報修", href: "/admin/store/issues?new=1&type=repair" },
  { id: "special", label: "客人特殊需求", href: "/admin/store/issues?new=1&type=special" },
  { id: "request", label: "分店需求", href: "/admin/store/inventory" },
  { id: "worklog", label: "每日工作紀錄", href: "/admin/store#checklist" },
  { id: "message", label: "留言", href: "/admin/store#messages" },
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
