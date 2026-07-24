/** Store module helpers — Product Master remains `products`. */

export type StoreResource =
  | "inventory"
  | "batches"
  | "anomalies"
  | "returns"
  | "disposals"
  | "reservations";

export const STORE_RESOURCE_TABLE: Record<StoreResource, string> = {
  inventory: "store_inventory",
  batches: "store_batches",
  anomalies: "store_anomalies",
  returns: "store_returns",
  disposals: "store_disposals",
  reservations: "store_reservations",
};

export const STORE_QUICK_ACTIONS = [
  { href: "/admin/store/expiry?new=1", label: "新增效期" },
  { href: "/admin/store/batch?tab=expiry", label: "批次效期登記" },
  { href: "/admin/store/disposals?new=1", label: "新增報廢" },
  { href: "/admin/store/batch?tab=disposal", label: "批次報廢登記" },
  { href: "/admin/store/issues?new=1", label: "異常登記" },
  { href: "/admin/store/returns?new=1", label: "退貨登記" },
  { href: "/admin/store/batch?tab=scan", label: "掃描條碼" },
  { href: "/admin/store/batch?tab=import", label: "匯入 Excel" },
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
