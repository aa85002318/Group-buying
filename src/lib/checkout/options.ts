import type { PaymentGateway, ShipmentMethod } from "@/lib/types/database";

export type CheckoutPaymentOption = {
  value: PaymentGateway;
  label: string;
  description: string;
  enabled: boolean;
};

export type CheckoutShipmentOption = {
  value: ShipmentMethod;
  label: string;
  description: string;
  enabled: boolean;
  /** 預留運費（尚未串物流時顯示用） */
  feeHint?: string;
};

export const CHECKOUT_PAYMENT_OPTIONS: CheckoutPaymentOption[] = [
  {
    value: "store_cash",
    label: "門市付款",
    description: "取貨時於門市現金／轉帳付款",
    enabled: true,
  },
  {
    value: "bank_transfer",
    label: "銀行轉帳",
    description: "下單後依指示轉帳，並回報付款資訊",
    enabled: true,
  },
  {
    value: "ecpay",
    label: "信用卡（綠界）",
    description: "線上刷卡 — 即將開放",
    enabled: false,
  },
  {
    value: "newebpay",
    label: "信用卡（藍新）",
    description: "線上刷卡 — 即將開放",
    enabled: false,
  },
];

export const CHECKOUT_SHIPMENT_OPTIONS: CheckoutShipmentOption[] = [
  {
    value: "store_pickup",
    label: "門市取貨",
    description: "至指定門市取貨",
    enabled: true,
    feeHint: "免運",
  },
  {
    value: "home_delivery",
    label: "宅配到府",
    description: "黑貓／宅配通 — 即將開放",
    enabled: false,
    feeHint: "運費待計算",
  },
  {
    value: "cvs_pickup",
    label: "超商取貨",
    description: "7-11 / 全家 — 即將開放",
    enabled: false,
    feeHint: "運費待計算",
  },
];

export function shippingFeeForMethod(method: ShipmentMethod): number {
  if (method === "store_pickup") return 0;
  return 0;
}
