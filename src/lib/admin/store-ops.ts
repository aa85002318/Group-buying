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
  { href: "/admin/store/batches?receive=1", label: "快速進貨" },
  { href: "/admin/store/expiry?new=1", label: "新增效期批次" },
  { href: "/admin/store/batches", label: "批次管理" },
  { href: "/admin/store/disposals?new=1", label: "報廢（選批次）" },
  { href: "/admin/store/returns?new=1", label: "退貨（選批次）" },
  { href: "/admin/store/issues?new=1", label: "異常（選批次）" },
  { href: "/admin/store/stocktake", label: "盤點管理" },
  { href: "/admin/store/batches?tab=import", label: "批次匯入" },
  { href: "/admin/products", label: "商品主檔" },
  { href: "/admin/store/backups", label: "立即備份" },
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
  if (days <= 7) return "緊急";
  if (days <= 30) return "即將到期";
  return "正常";
}

export type MovementType =
  | "receive"
  | "return"
  | "disposal"
  | "stocktake"
  | "adjust"
  | "sale"
  | "transfer";
