/** Store collaboration center — customer service (order / price inquiry). Not POS. */

export type StoreCustomerRequestType = "order" | "price_inquiry";

export type StoreCustomerSource =
  | "store"
  | "line"
  | "phone"
  | "facebook"
  | "instagram"
  | "group_buy"
  | "website";

export type StoreCustomerRequestStatus =
  | "pending"
  | "quoted"
  | "notified"
  | "paid"
  | "picked_up"
  | "done"
  | "cancelled";

export const STORE_CUSTOMER_REQUEST_TYPES: Array<{
  id: StoreCustomerRequestType;
  label: string;
  description: string;
}> = [
  { id: "order", label: "商品訂購", description: "現場登記客戶要訂的商品" },
  { id: "price_inquiry", label: "價格詢問", description: "大量／批發價等詢問，不建電商訂單" },
];

export const STORE_CUSTOMER_SOURCES: Array<{ id: StoreCustomerSource; label: string }> = [
  { id: "store", label: "門市" },
  { id: "line", label: "LINE" },
  { id: "phone", label: "電話" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "group_buy", label: "團購" },
  { id: "website", label: "官網" },
];

/** Full status list (DB-compatible). Prefer typed pipelines in UI. */
export const STORE_CUSTOMER_STATUSES: Array<{
  id: StoreCustomerRequestStatus;
  label: string;
}> = [
  { id: "pending", label: "待確認" },
  { id: "quoted", label: "查詢中／已報價" },
  { id: "notified", label: "已通知／已回覆" },
  { id: "paid", label: "已確認" },
  { id: "picked_up", label: "已取貨" },
  { id: "done", label: "已完成" },
  { id: "cancelled", label: "已取消" },
];

/** Order pipeline: 待確認 → 查詢中／待到貨 → 已通知 → 已完成 */
export const ORDER_STATUS_PIPELINE: Array<{
  id: StoreCustomerRequestStatus;
  label: string;
}> = [
  { id: "pending", label: "待確認" },
  { id: "quoted", label: "查詢中／待到貨" },
  { id: "notified", label: "已通知" },
  { id: "done", label: "已完成" },
  { id: "cancelled", label: "已取消" },
];

/** Price inquiry pipeline: 待查價 → 已報價 → 已回覆 → 完成 */
export const INQUIRY_STATUS_PIPELINE: Array<{
  id: StoreCustomerRequestStatus;
  label: string;
}> = [
  { id: "pending", label: "待查價" },
  { id: "quoted", label: "已報價" },
  { id: "notified", label: "已回覆" },
  { id: "done", label: "已完成" },
  { id: "cancelled", label: "已取消" },
];

export const STORE_ASSIGNEE_OPTIONS = ["店長", "業務", "客服", "倉儲", "未指定"] as const;

export type StoreCustomerRequest = {
  id: string;
  store_id: string;
  request_type: StoreCustomerRequestType;
  customer_name: string;
  customer_phone: string;
  customer_source: StoreCustomerSource | null;
  product_id: string | null;
  barcode: string | null;
  vendor_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  stock_snapshot: number | null;
  in_stock: boolean | null;
  expected_arrival_date: string | null;
  pickup_store_id?: string | null;
  inquiry_body: string | null;
  needs_reply: boolean;
  note: string | null;
  internal_note: string | null;
  status: StoreCustomerRequestStatus;
  track_notified: boolean;
  track_paid: boolean;
  track_picked_up: boolean;
  track_done: boolean;
  assigned_to: string | null;
  assigned_to_name: string | null;
  follow_up_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    id?: string;
    name?: string;
    sku?: string | null;
    barcode?: string | null;
    supplier_name?: string | null;
    price?: number | null;
    unit?: string | null;
    brands?: { name?: string } | { name?: string }[] | null;
  } | null;
  suppliers?: { id?: string; name?: string } | null;
  pickup_store?: { id?: string; name?: string } | null;
};

export function requestTypeLabel(t: string): string {
  return STORE_CUSTOMER_REQUEST_TYPES.find((x) => x.id === t)?.label ?? t;
}

export function statusPipelineForType(type: StoreCustomerRequestType) {
  return type === "price_inquiry" ? INQUIRY_STATUS_PIPELINE : ORDER_STATUS_PIPELINE;
}

export function requestStatusLabel(
  status: string,
  type?: StoreCustomerRequestType | null
): string {
  if (type) {
    const fromPipeline = statusPipelineForType(type).find((x) => x.id === status);
    if (fromPipeline) return fromPipeline.label;
  }
  return STORE_CUSTOMER_STATUSES.find((x) => x.id === status)?.label ?? status;
}

export function nextStatusInPipeline(
  type: StoreCustomerRequestType,
  current: StoreCustomerRequestStatus
): StoreCustomerRequestStatus | null {
  const pipeline = statusPipelineForType(type).filter((s) => s.id !== "cancelled");
  const idx = pipeline.findIndex((s) => s.id === current);
  if (idx < 0 || idx >= pipeline.length - 1) return null;
  return pipeline[idx + 1]!.id;
}
