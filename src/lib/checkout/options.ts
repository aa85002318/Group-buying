import { getEcpaySettings } from "@/lib/ecpay/settings";
import {
  CHECKOUT_PAYMENT_OPTIONS,
  CHECKOUT_SHIPMENT_OPTIONS,
  shippingFeeForMethod,
  type CheckoutPaymentOption,
  type CheckoutShipmentOption,
} from "@/lib/checkout/shipment-options";

/**
 * 伺服器端的結帳選項（會依後台綠界設定覆寫開關）。
 *
 * 靜態定義搬到 checkout/shipment-options.ts，因為那些常數前台（結帳頁、商品頁）
 * 也要用，而這支檔案 import 了 getEcpaySettings → createAdminClient，不該被拉進
 * 瀏覽器的打包範圍。這裡 re-export 以維持既有的 import 路徑可用。
 */
export {
  CHECKOUT_PAYMENT_OPTIONS,
  CHECKOUT_SHIPMENT_OPTIONS,
  shippingFeeForMethod,
};
export type { CheckoutPaymentOption, CheckoutShipmentOption };

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
