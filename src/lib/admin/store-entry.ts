/** Shared field-entry types for store workbench. */

export type StoreEntryType =
  | "issue_return"
  | "issue"
  | "disposal"
  | "return"
  | "repair"
  | "special"
  | "message";

export type StoreEntryDef = {
  id: StoreEntryType;
  label: string;
  description: string;
  requiresProduct: boolean;
  /** Batch is optional for issue/return/disposal/repair (選填) */
  requiresBatch: boolean;
  requiresQuantity: boolean;
  optionalProduct?: boolean;
  anomalyType?: string;
  resource:
    | "anomalies"
    | "disposals"
    | "returns"
    | "issue_return"
    | "store_messages";
};

export const STORE_ENTRY_TYPES: StoreEntryDef[] = [
  {
    id: "issue_return",
    label: "異常／退貨",
    description: "客戶退貨、到貨異常等（同一表單）",
    requiresProduct: true,
    requiresBatch: false,
    requiresQuantity: true,
    resource: "issue_return",
  },
  {
    id: "disposal",
    label: "商品報廢",
    description: "報廢登記（批次選填）",
    requiresProduct: true,
    requiresBatch: false,
    requiresQuantity: true,
    resource: "disposals",
  },
  {
    id: "repair",
    label: "商品報修",
    description: "客戶資料、廠商與狀態軌跡",
    requiresProduct: true,
    requiresBatch: false,
    requiresQuantity: false,
    anomalyType: "repair",
    resource: "anomalies",
  },
  {
    id: "special",
    label: "客人特殊需求",
    description: "可選商品；無商品則記為門市備註",
    requiresProduct: false,
    requiresBatch: false,
    requiresQuantity: false,
    optionalProduct: true,
    anomalyType: "special",
    resource: "anomalies",
  },
  {
    id: "message",
    label: "留言",
    description: "店內留言給同事",
    requiresProduct: false,
    requiresBatch: false,
    requiresQuantity: false,
    resource: "store_messages",
  },
];

/** Legacy aliases map to unified / same defs */
const LEGACY_ALIASES: Record<string, StoreEntryType> = {
  issue: "issue_return",
  return: "issue_return",
};

export function getStoreEntryDef(id: string | null | undefined): StoreEntryDef | null {
  if (!id) return null;
  if (id === "worklog" || id === "request") return null;
  const resolved = LEGACY_ALIASES[id] ?? id;
  return STORE_ENTRY_TYPES.find((t) => t.id === resolved) ?? null;
}

/** 異常／退貨 case kinds */
export const ISSUE_RETURN_CASE_OPTIONS = [
  { value: "customer_return", label: "客戶退貨" },
  { value: "arrival_anomaly", label: "到貨異常" },
  { value: "damage", label: "損壞" },
  { value: "shortage", label: "短缺" },
  { value: "surplus", label: "多餘" },
  { value: "expiry", label: "效期" },
  { value: "other", label: "其他" },
] as const;

export const ISSUE_ANOMALY_OPTIONS = ISSUE_RETURN_CASE_OPTIONS;

/** Shared statuses for 異常／退貨 */
export const ISSUE_RETURN_STATUS_OPTIONS = [
  { value: "pending", label: "待處理" },
  { value: "exchanged", label: "已退換給客人" },
  { value: "destroyed", label: "已銷毀" },
  { value: "awaiting_vendor", label: "待廠商退回" },
  { value: "vendor_received", label: "廠商已收回" },
] as const;

export const REPAIR_STATUS_OPTIONS = [
  { value: "notified_vendor", label: "已告知廠商" },
  { value: "vendor_collected", label: "廠商收回" },
  { value: "repair_done_contacted", label: "維修完成聯繫客人" },
  { value: "customer_picked_up", label: "客人已取回" },
] as const;

export const DISPOSAL_STATUS_OPTIONS = [
  { value: "disposed", label: "已報廢" },
  { value: "pending", label: "待處理" },
  { value: "vendor_returned", label: "廠商退回" },
] as const;

export const STORE_REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "待審核",
  approved: "已同意",
  rejected: "已退回",
  fulfilled: "已完成",
  cancelled: "已取消",
};

export const ISSUE_RETURN_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ISSUE_RETURN_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const REPAIR_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  REPAIR_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const DISPOSAL_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  DISPOSAL_STATUS_OPTIONS.map((o) => [o.value, o.label])
);
