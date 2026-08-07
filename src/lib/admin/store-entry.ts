/** Shared field-entry types for store workbench / 商品處理. */

export type StoreEntryType =
  | "issue"
  | "issue_return"
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
  /** Batch is optional for issue/return/disposal/repair */
  requiresBatch: boolean;
  requiresQuantity: boolean;
  optionalProduct?: boolean;
  anomalyType?: string;
  group: "product" | "other";
  resource:
    | "anomalies"
    | "disposals"
    | "returns"
    | "issue_return"
    | "store_messages";
};

/** 商品處理共用表單主類型（流程 D） */
export const PRODUCT_HANDLING_TYPES: StoreEntryDef[] = [
  {
    id: "issue",
    label: "商品異常",
    description: "包裝破損、短缺、效期異常等；可標記暫停銷售",
    requiresProduct: true,
    requiresBatch: false,
    requiresQuantity: true,
    resource: "anomalies",
    group: "product",
  },
  {
    id: "disposal",
    label: "商品報廢",
    description: "報廢原因、效期、主管確認",
    requiresProduct: true,
    requiresBatch: false,
    requiresQuantity: true,
    resource: "disposals",
    group: "product",
  },
  {
    id: "return",
    label: "商品退貨",
    description: "退貨對象、預計退貨日",
    requiresProduct: true,
    requiresBatch: false,
    requiresQuantity: true,
    resource: "returns",
    group: "product",
  },
  {
    id: "repair",
    label: "商品報修",
    description: "故障說明、緊急程度、是否影響營運",
    requiresProduct: true,
    requiresBatch: false,
    requiresQuantity: false,
    anomalyType: "repair",
    resource: "anomalies",
    group: "product",
  },
];

export const STORE_ENTRY_OTHER_TYPES: StoreEntryDef[] = [
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
    group: "other",
  },
  {
    id: "message",
    label: "留言",
    description: "店內留言給同事",
    requiresProduct: false,
    requiresBatch: false,
    requiresQuantity: false,
    resource: "store_messages",
    group: "other",
  },
];

export const STORE_ENTRY_TYPES: StoreEntryDef[] = [
  ...PRODUCT_HANDLING_TYPES,
  ...STORE_ENTRY_OTHER_TYPES,
];

/** Legacy aliases map to unified / same defs */
const LEGACY_ALIASES: Record<string, StoreEntryType> = {
  issue_return: "issue",
};

export function getStoreEntryDef(id: string | null | undefined): StoreEntryDef | null {
  if (!id) return null;
  if (id === "worklog" || id === "request") return null;
  const resolved = (LEGACY_ALIASES[id] ?? id) as StoreEntryType;
  return STORE_ENTRY_TYPES.find((t) => t.id === resolved) ?? null;
}

/** 商品異常類型 */
export const ISSUE_ANOMALY_OPTIONS = [
  { value: "damage", label: "損壞／包裝破損" },
  { value: "shortage", label: "短缺" },
  { value: "surplus", label: "多餘" },
  { value: "expiry", label: "效期異常" },
  { value: "arrival_anomaly", label: "到貨異常" },
  { value: "other", label: "其他" },
] as const;

/** @deprecated use ISSUE_ANOMALY_OPTIONS / RETURN flow */
export const ISSUE_RETURN_CASE_OPTIONS = [
  { value: "customer_return", label: "客戶退貨" },
  { value: "arrival_anomaly", label: "到貨異常" },
  { value: "damage", label: "損壞" },
  { value: "shortage", label: "短缺" },
  { value: "surplus", label: "多餘" },
  { value: "expiry", label: "效期" },
  { value: "other", label: "其他" },
] as const;

export const DISPOSAL_REASON_OPTIONS = [
  { value: "expired", label: "過期" },
  { value: "damaged", label: "損壞無法售" },
  { value: "quality", label: "品質不良" },
  { value: "sample", label: "試吃／樣品耗用" },
  { value: "other", label: "其他" },
] as const;

export const RETURN_TARGET_OPTIONS = [
  { value: "supplier", label: "退回廠商" },
  { value: "hq", label: "退回總部／倉儲" },
  { value: "customer", label: "客戶退貨入庫" },
  { value: "other", label: "其他" },
] as const;

export const REPAIR_URGENCY_OPTIONS = [
  { value: "low", label: "低" },
  { value: "normal", label: "一般" },
  { value: "high", label: "高" },
  { value: "urgent", label: "緊急" },
] as const;

/** Shared statuses for 異常 */
export const ISSUE_STATUS_OPTIONS = [
  { value: "pending", label: "待處理" },
  { value: "processing", label: "處理中" },
  { value: "resolved", label: "已處理" },
  { value: "closed", label: "已結案" },
] as const;

/** @deprecated alias */
export const ISSUE_RETURN_STATUS_OPTIONS = [
  { value: "pending", label: "待處理" },
  { value: "exchanged", label: "已退換給客人" },
  { value: "destroyed", label: "已銷毀" },
  { value: "awaiting_vendor", label: "待廠商退回" },
  { value: "vendor_received", label: "廠商已收回" },
] as const;

export const RETURN_STATUS_OPTIONS = [
  { value: "pending", label: "待處理" },
  { value: "awaiting_vendor", label: "待廠商退回" },
  { value: "vendor_received", label: "廠商已收回" },
  { value: "completed", label: "已完成" },
] as const;

export const REPAIR_STATUS_OPTIONS = [
  { value: "notified_vendor", label: "已告知廠商" },
  { value: "vendor_collected", label: "廠商收回" },
  { value: "repair_done_contacted", label: "維修完成聯繫客人" },
  { value: "customer_picked_up", label: "客人已取回" },
] as const;

export const DISPOSAL_STATUS_OPTIONS = [
  { value: "pending", label: "待處理" },
  { value: "disposed", label: "已報廢" },
  { value: "vendor_returned", label: "廠商退回" },
] as const;

export const STORE_REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "待確認",
  approved: "可供應",
  partial: "部分供應",
  rejected: "無法供應",
  arranged: "已安排",
  handed_over: "已交接",
  fulfilled: "已完成",
  cancelled: "已取消",
};

/** Cross-store demand reply pipeline (restock). */
export const STORE_DEMAND_STATUS_PIPELINE = [
  { id: "pending", label: "待確認" },
  { id: "approved", label: "可供應" },
  { id: "partial", label: "部分供應" },
  { id: "rejected", label: "無法供應" },
  { id: "arranged", label: "已安排" },
  { id: "handed_over", label: "已交接" },
  { id: "fulfilled", label: "已完成" },
] as const;

export type StoreDemandStatus = (typeof STORE_DEMAND_STATUS_PIPELINE)[number]["id"] | "cancelled";

export function nextDemandStatus(current: string): string | null {
  const flow = ["pending", "approved", "arranged", "handed_over", "fulfilled"] as const;
  if (current === "partial") return "arranged";
  if (current === "rejected" || current === "cancelled" || current === "fulfilled") return null;
  const idx = flow.indexOf(current as (typeof flow)[number]);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1]!;
}

export const ISSUE_RETURN_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ISSUE_RETURN_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const ISSUE_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ISSUE_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const RETURN_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  RETURN_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const REPAIR_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  REPAIR_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const DISPOSAL_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  DISPOSAL_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const PRODUCT_HANDLING_FLOW_STEPS = [
  "選擇處理類型",
  "掃描商品",
  "輸入數量",
  "選擇原因／細節",
  "拍照上傳",
  "備註與負責人",
  "確認處理",
] as const;
