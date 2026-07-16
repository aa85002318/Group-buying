import type { PaymentGateway, ShipmentMethod } from "@/lib/types/database";
import { getEcpaySettings } from "@/lib/ecpay/settings";

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

/** Merge static options with admin ECPay toggles (credentials still required for readiness). */
export async function getCheckoutOptions() {
  const ecpay = await getEcpaySettings();
  const credentialsOk = Boolean(
    ecpay.merchantId.trim() && ecpay.hashKey.trim() && ecpay.hashIv.trim()
  );
  const ecpayPayOpen = ecpay.paymentEnabled && credentialsOk && ecpay.creditCardEnabled;

  const payments = CHECKOUT_PAYMENT_OPTIONS.map((opt) => {
    if (opt.value !== "ecpay") return opt;
    return {
      ...opt,
      enabled: ecpayPayOpen,
      description: ecpayPayOpen
        ? "線上刷卡（綠界）"
        : ecpay.paymentEnabled
          ? "綠界已開啟，請補齊 MerchantID／HashKey／HashIV"
          : "線上刷卡 — 請於後台「綠界串接」啟用",
    };
  });

  const shipments = CHECKOUT_SHIPMENT_OPTIONS.map((opt) => {
    if (opt.value === "home_delivery") {
      const enabled =
        ecpay.logisticsEnabled && ecpay.homeDeliveryEnabled && credentialsOk;
      return {
        ...opt,
        enabled,
        description: enabled ? "綠界宅配到府" : opt.description,
      };
    }
    if (opt.value === "cvs_pickup") {
      const enabled =
        ecpay.logisticsEnabled && ecpay.cvsPickupEnabled && credentialsOk;
      return {
        ...opt,
        enabled,
        description: enabled ? "綠界超商取貨" : opt.description,
      };
    }
    return opt;
  });

  return { payments, shipments, ecpay };
}

export function shippingFeeForMethod(method: ShipmentMethod): number {
  if (method === "store_pickup") return 0;
  return 0;
}
