/** Shared field-entry types for store workbench (Phase B/C). */

export type StoreEntryType =
  | "issue"
  | "disposal"
  | "return"
  | "repair"
  | "special"
  | "request"
  | "worklog"
  | "message";

export type StoreEntryDef = {
  id: StoreEntryType;
  label: string;
  description: string;
  /** Needs product + batch from master catalog */
  requiresProduct: boolean;
  requiresBatch: boolean;
  requiresQuantity: boolean;
  /** Allow optional product pick even when not required */
  optionalProduct?: boolean;
  /** Maps to store_anomalies.anomaly_type when resource is anomalies */
  anomalyType?: string;
  resource:
    | "anomalies"
    | "disposals"
    | "returns"
    | "store_requests"
    | "store_messages"
    | "store_work_logs";
};

export const STORE_ENTRY_TYPES: StoreEntryDef[] = [
  {
    id: "issue",
    label: "商品異常",
    description: "損壞、短缺、效期異常等",
    requiresProduct: true,
    requiresBatch: true,
    requiresQuantity: false,
    resource: "anomalies",
  },
  {
    id: "disposal",
    label: "商品報廢",
    description: "報廢必須指定批次",
    requiresProduct: true,
    requiresBatch: true,
    requiresQuantity: true,
    resource: "disposals",
  },
  {
    id: "return",
    label: "商品退貨",
    description: "退貨必須指定批次",
    requiresProduct: true,
    requiresBatch: true,
    requiresQuantity: true,
    resource: "returns",
  },
  {
    id: "repair",
    label: "商品報修",
    description: "設備／商品報修（寫入異常）",
    requiresProduct: true,
    requiresBatch: true,
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
    id: "request",
    label: "分店需求",
    description: "叫貨／補貨（可同意／退回）",
    requiresProduct: false,
    requiresBatch: false,
    requiresQuantity: true,
    optionalProduct: true,
    resource: "store_requests",
  },
  {
    id: "worklog",
    label: "每日工作紀錄",
    description: "今日工作備註",
    requiresProduct: false,
    requiresBatch: false,
    requiresQuantity: false,
    resource: "store_work_logs",
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

export function getStoreEntryDef(id: string | null | undefined): StoreEntryDef | null {
  if (!id) return null;
  return STORE_ENTRY_TYPES.find((t) => t.id === id) ?? null;
}

export const ISSUE_ANOMALY_OPTIONS = [
  { value: "damage", label: "損壞" },
  { value: "shortage", label: "短缺" },
  { value: "surplus", label: "多餘" },
  { value: "expiry", label: "效期" },
  { value: "other", label: "其他" },
] as const;

export const STORE_REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "待審核",
  approved: "已同意",
  rejected: "已退回",
  fulfilled: "已完成",
  cancelled: "已取消",
};
