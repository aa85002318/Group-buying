import type { PaymentGateway, ShipmentMethod } from "@/lib/types/database";

/**
 * 結帳方式的靜態定義。
 *
 * 刻意獨立成一個「沒有任何伺服器端 import」的模組：原本這些常數放在
 * checkout/options.ts，而那支檔案 import 了 getEcpaySettings → createAdminClient。
 * 結帳頁與商品頁都是 client component，從那裡引入會把伺服器端的程式碼一起打包進
 * 瀏覽器（service_role key 本身因為沒有 NEXT_PUBLIC_ 前綴，在前端會被替換成
 * undefined，所以不會外洩，但沒必要把那段程式碼送到瀏覽器）。
 *
 * options.ts 會再 re-export 這裡的內容，所以只有一份真實來源。
 */

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
    description: "下單後至門市繳費；門市人員確認收款後，訂單才正式成立",
    enabled: true,
  },
  {
    value: "bank_transfer",
    label: "銀行匯款",
    description: "下單後請於期限內匯款，並於訂單回報匯款資訊；確認後訂單才正式成立",
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
    description: "付款確認後，持取貨 QR 至指定門市取貨",
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

/**
 * 這個配送方式目前整站有沒有開通。
 *
 * 注意這是「站台層級」的開關，跟單一商品在後台勾了什麼是兩件事：
 * 商品勾了宅配，但整站物流還沒開通的話，客戶還是下不了宅配單
 * （/api/orders 會直接擋掉）。商品頁要同時反映這兩層才不會誤導客戶。
 */
export function isShipmentMethodOpen(method: ShipmentMethod): boolean {
  return CHECKOUT_SHIPMENT_OPTIONS.find((o) => o.value === method)?.enabled ?? false;
}
