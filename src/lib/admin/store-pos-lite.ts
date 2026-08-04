/** POS Lite — in-store customer service (not ecommerce orders). */

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
  { id: "price_inquiry", label: "價格詢問", description: "大量／批發價等詢問，不建訂單" },
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

export const STORE_CUSTOMER_STATUSES: Array<{
  id: StoreCustomerRequestStatus;
  label: string;
}> = [
  { id: "pending", label: "待確認" },
  { id: "quoted", label: "已報價" },
  { id: "notified", label: "已通知" },
  { id: "paid", label: "已付款" },
  { id: "picked_up", label: "已取貨" },
  { id: "done", label: "已完成" },
  { id: "cancelled", label: "已取消" },
];

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
};

export function requestTypeLabel(t: string): string {
  return STORE_CUSTOMER_REQUEST_TYPES.find((x) => x.id === t)?.label ?? t;
}

export function requestStatusLabel(s: string): string {
  return STORE_CUSTOMER_STATUSES.find((x) => x.id === s)?.label ?? s;
}
