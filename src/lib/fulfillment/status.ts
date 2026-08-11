/** Canonical fulfillment statuses for mall + store pickup (phase 1). */

export const FULFILLMENT_STATUSES = [
  "pending_payment",
  "payment_failed",
  "paid",
  "preparing",
  "ready_for_pickup",
  "shipped",
  "picked_up",
  "delivered",
  "completed",
  "cancel_requested",
  "cancelled",
  "refund_pending",
  "refunded",
  "pickup_expired",
  "exception",
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  pending_payment: "待付款",
  payment_failed: "付款失敗",
  paid: "已付款",
  preparing: "備貨中",
  ready_for_pickup: "可取貨",
  shipped: "已出貨",
  picked_up: "已取貨",
  delivered: "已送達",
  completed: "已完成",
  cancel_requested: "取消申請中",
  cancelled: "已取消",
  refund_pending: "退款處理中",
  refunded: "已退款",
  pickup_expired: "逾期未取",
  exception: "異常處理中",
};

export type MemberOrderBucket =
  | "pending_payment"
  | "processing"
  | "ready"
  | "shipped"
  | "completed"
  | "cancel_refund"
  | "exception";

export const MEMBER_BUCKET_LABELS: Record<MemberOrderBucket, string> = {
  pending_payment: "待付款",
  processing: "處理中",
  ready: "可取貨",
  shipped: "已出貨",
  completed: "已完成",
  cancel_refund: "取消／退款",
  exception: "異常處理",
};

const LEGACY_TO_CANONICAL: Record<string, FulfillmentStatus> = {
  pending: "pending_payment",
  awaiting_payment: "pending_payment",
  payment_reported: "pending_payment",
  payment_failed: "payment_failed",
  payment_confirmed: "paid",
  paid: "paid",
  preparing: "preparing",
  ready_for_pickup: "ready_for_pickup",
  shipped: "shipped",
  picked_up: "picked_up",
  delivered: "delivered",
  completed: "completed",
  cancel_requested: "cancel_requested",
  cancelled: "cancelled",
  refund_pending: "refund_pending",
  refunded: "refunded",
  pickup_expired: "pickup_expired",
  exception: "exception",
};

/** Closest value that exists on current Postgres order_status enum. */
const CANONICAL_TO_WRITABLE_ENUM: Record<FulfillmentStatus, string> = {
  pending_payment: "awaiting_payment",
  payment_failed: "awaiting_payment",
  paid: "payment_confirmed",
  preparing: "preparing",
  ready_for_pickup: "ready_for_pickup",
  shipped: "preparing",
  picked_up: "completed",
  delivered: "completed",
  completed: "completed",
  cancel_requested: "payment_confirmed",
  cancelled: "cancelled",
  refund_pending: "cancelled",
  refunded: "refunded",
  pickup_expired: "ready_for_pickup",
  exception: "preparing",
};

export function canonicalizeStatus(
  status: string | null | undefined,
  fulfillmentStatus?: string | null
): FulfillmentStatus {
  if (fulfillmentStatus && LEGACY_TO_CANONICAL[fulfillmentStatus]) {
    return LEGACY_TO_CANONICAL[fulfillmentStatus];
  }
  if (status && LEGACY_TO_CANONICAL[status]) return LEGACY_TO_CANONICAL[status];
  return "pending_payment";
}

export function writableOrderStatus(status: FulfillmentStatus): string {
  return CANONICAL_TO_WRITABLE_ENUM[status];
}

export function fulfillmentLabel(status: string | null | undefined): string {
  const key = canonicalizeStatus(status);
  return FULFILLMENT_STATUS_LABELS[key];
}

export function memberBucket(status: FulfillmentStatus): MemberOrderBucket {
  switch (status) {
    case "pending_payment":
    case "payment_failed":
      return "pending_payment";
    case "paid":
    case "preparing":
      return "processing";
    case "ready_for_pickup":
      return "ready";
    case "shipped":
      return "shipped";
    case "picked_up":
    case "delivered":
    case "completed":
      return "completed";
    case "cancel_requested":
    case "cancelled":
    case "refund_pending":
    case "refunded":
      return "cancel_refund";
    case "pickup_expired":
    case "exception":
      return "exception";
  }
}

export const MEMBER_LIST_FILTERS: Array<{
  key: "all" | Exclude<MemberOrderBucket, "shipped" | "exception">;
  label: string;
  buckets: MemberOrderBucket[];
}> = [
  { key: "all", label: "全部", buckets: [] },
  { key: "pending_payment", label: "待付款", buckets: ["pending_payment"] },
  { key: "processing", label: "處理中", buckets: ["processing", "shipped"] },
  { key: "ready", label: "可取貨", buckets: ["ready"] },
  { key: "completed", label: "已完成", buckets: ["completed"] },
  { key: "cancel_refund", label: "取消／退款", buckets: ["cancel_refund", "exception"] },
];

export function isPaidFulfillment(status: FulfillmentStatus): boolean {
  return ![
    "pending_payment",
    "payment_failed",
    "cancelled",
    "refunded",
    "refund_pending",
  ].includes(status);
}

export function pickupCodeAllowed(status: FulfillmentStatus): boolean {
  return status === "ready_for_pickup";
}

export function isTerminalStatus(status: FulfillmentStatus): boolean {
  return ["completed", "cancelled", "refunded", "picked_up", "delivered"].includes(status);
}

const ALLOWED_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending_payment: ["payment_failed", "paid", "cancel_requested", "cancelled", "exception"],
  payment_failed: ["pending_payment", "cancelled", "exception"],
  paid: ["preparing", "cancel_requested", "refund_pending", "exception"],
  preparing: ["ready_for_pickup", "shipped", "exception", "cancel_requested", "refund_pending"],
  ready_for_pickup: ["picked_up", "pickup_expired", "exception", "cancel_requested"],
  shipped: ["delivered", "exception"],
  picked_up: ["completed"],
  delivered: ["completed"],
  completed: [],
  cancel_requested: ["cancelled", "refund_pending", "preparing", "paid"],
  cancelled: ["refund_pending"],
  refund_pending: ["refunded", "cancelled"],
  refunded: [],
  pickup_expired: ["ready_for_pickup", "refund_pending", "cancelled", "exception"],
  exception: ["preparing", "ready_for_pickup", "refund_pending", "cancelled", "paid"],
};

export function canTransition(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export const STORE_ORDER_ACTIONS = [
  "accept",
  "start_preparing",
  "mark_ready",
  "notify_pickup",
  "extend_deadline",
  "mark_exception",
  "mark_out_of_stock",
  "request_cancel",
  "request_refund",
  "complete",
] as const;

export type StoreOrderAction = (typeof STORE_ORDER_ACTIONS)[number];
