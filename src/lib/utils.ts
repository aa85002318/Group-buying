import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `GB${date}${rand}`;
}

export const ROLE_LABELS: Record<string, string> = {
  member: "一般會員",
  admin: "管理員",
  store_staff: "門市人員",
  group_leader: "團主",
  promoter: "推廣人員",
  livestream_host: "直播主",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "待處理",
  awaiting_payment: "待付款（尚未正式成立）",
  payment_reported: "已回報匯款（待確認）",
  payment_confirmed: "付款已確認（訂單成立）",
  paid: "已付款",
  preparing: "備貨中",
  ready_for_pickup: "待取貨",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

export const ORDER_PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "未付款",
  paid_online: "線上已付款",
  paid_store: "門市已收款",
  failed: "付款失敗",
  refunded: "已退款",
  cancelled: "已取消",
};

export const ORDER_PICKUP_STATUS_LABELS: Record<string, string> = {
  pending: "待備貨",
  ready: "待取貨",
  picked_up: "已取貨",
  returned: "已退回",
  cancelled: "已取消",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "待審核",
  confirmed: "已確認",
  rejected: "已拒絕",
};

export const PAYMENT_GATEWAY_LABELS: Record<string, string> = {
  store_cash: "門市付款",
  bank_transfer: "銀行匯款",
  ecpay: "綠界金流",
  newebpay: "藍新金流",
  manual: "手動紀錄",
};

export const SHIPMENT_METHOD_LABELS: Record<string, string> = {
  store_pickup: "門市取貨",
  home_delivery: "宅配到府",
  cvs_pickup: "超商取貨",
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: "待處理",
  processing: "處理中",
  shipped: "已出貨",
  in_transit: "運送中",
  arrived: "已到達",
  ready_for_pickup: "待取件",
  delivered: "已送達",
  picked_up: "已取貨",
  failed: "配送失敗",
  returned: "已退回",
  cancelled: "已取消",
};

export const REWARD_STATUS_LABELS: Record<string, string> = {
  pending: "待審核",
  approved: "已核准",
  issued: "已發放",
  rejected: "已拒絕",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "待處理",
  in_progress: "處理中",
  resolved: "已結案",
  closed: "已關閉",
};

export const GROUP_BUY_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  active: "進行中",
  ended: "已結束",
  cancelled: "已取消",
};

export const LIVESTREAM_STATUS_LABELS: Record<string, string> = {
  scheduled: "已排程",
  live: "直播中",
  ended: "已結束",
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending_calculation: "待計算",
  pending_review: "待審核",
  approved: "已核准",
  issued: "已發放",
  rejected: "已拒絕",
  cancelled: "已取消",
  clawed_back: "已追回",
};
