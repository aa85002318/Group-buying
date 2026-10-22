"use client";

import Link from "next/link";
import { Snowflake, Store, Thermometer, Truck } from "lucide-react";
import { isShipmentMethodOpen } from "@/lib/checkout/shipment-options";
import { TEMPERATURE_ZONE_LABELS } from "@/lib/checkout/temperature-zones";
import { looksLikeHtml } from "@/lib/cms/safeHtml";
import { RichTextHtml } from "@/components/cms/RichTextHtml";

/**
 * 商品頁的「配送與取貨」區塊。
 *
 * 刻意做成一個共用元件：原本分頁版與長版各寫一份，結果兩邊內容不一樣——
 * 分頁版少了「配送注意事項」與「查看完整配送說明」，所以同一個商品在不同
 * 版型下看到的資訊量不同。做成一份就不會再走鐘。
 *
 * 顯示邏輯要同時反映兩層：
 *   1. 這個商品在後台勾了哪些配送方式（ship_* 欄位）
 *   2. 整站目前有沒有開通那個方式（結帳頁與 /api/orders 的實際限制）
 * 只看第一層的話，會對客戶承諾一個結帳時選不到的配送方式。
 */

type DeliveryProduct = {
  ship_home?: boolean | null;
  ship_store_pickup?: boolean | null;
  ship_cvs?: boolean | null;
  temp_ambient?: boolean | null;
  temp_chilled?: boolean | null;
  temp_frozen?: boolean | null;
  storage_type?: string | null;
};

/**
 * 後台欄位的預設值語意跟 product-form-v2 一致：
 * ship_home／ship_store_pickup／temp_ambient 沒設定時視為「開啟」，
 * ship_cvs／temp_chilled／temp_frozen 沒設定時視為「關閉」。
 * 這很重要——舊商品這些欄位可能是 null。
 */
function enabledByDefaultTrue(v: boolean | null | undefined) {
  return v !== false;
}
function enabledByDefaultFalse(v: boolean | null | undefined) {
  return v === true;
}

export function resolveDeliveryMethods(product: DeliveryProduct) {
  return [
    {
      key: "store_pickup" as const,
      label: "門市取貨",
      icon: Store,
      note: "持取貨 QR 至指定門市取貨",
      allowedByProduct: enabledByDefaultTrue(product.ship_store_pickup),
    },
    {
      key: "home_delivery" as const,
      label: "宅配到府",
      icon: Truck,
      note: "依結帳頁顯示之運費與配送時程",
      allowedByProduct: enabledByDefaultTrue(product.ship_home),
    },
    {
      key: "cvs_pickup" as const,
      label: "超商取貨",
      icon: Store,
      note: "7-11 / 全家",
      allowedByProduct: enabledByDefaultFalse(product.ship_cvs),
    },
  ]
    .filter((m) => m.allowedByProduct)
    .map((m) => ({ ...m, open: isShipmentMethodOpen(m.key) }));
}

export function resolveTemperatureZones(product: DeliveryProduct) {
  const zones: Array<{ key: "ambient" | "chilled" | "frozen"; label: string }> = [];
  if (enabledByDefaultTrue(product.temp_ambient) || product.storage_type === "ambient") {
    zones.push({ key: "ambient", label: TEMPERATURE_ZONE_LABELS.ambient });
  }
  if (enabledByDefaultFalse(product.temp_chilled) || product.storage_type === "chilled") {
    zones.push({ key: "chilled", label: TEMPERATURE_ZONE_LABELS.chilled });
  }
  if (enabledByDefaultFalse(product.temp_frozen) || product.storage_type === "frozen") {
    zones.push({ key: "frozen", label: TEMPERATURE_ZONE_LABELS.frozen });
  }
  return zones;
}

export function ProductDeliveryInfo({
  product,
  shippingNotice,
  /** 長版用 h2，分頁版的標題由分頁籤本身提供，所以不重複顯示。 */
  showHeading = false,
}: {
  product: DeliveryProduct;
  shippingNotice?: string | null;
  showHeading?: boolean;
}) {
  const methods = resolveDeliveryMethods(product);
  const zones = resolveTemperatureZones(product);
  const hasUnopened = methods.some((m) => !m.open);
  const multiZone = zones.length > 1;

  return (
    <div className="space-y-4">
      {showHeading ? (
        <h2 className="text-lg font-bold text-[#153E73] md:text-xl">配送與取貨</h2>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold text-[#153E73]">此商品可用的配送方式</p>
        {methods.length === 0 ? (
          <p className="text-sm text-[#667085]">
            此商品尚未設定配送方式，請與客服確認。
          </p>
        ) : (
          <ul className="space-y-2">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.key}
                  className="flex items-start gap-2 rounded-xl border border-[#E8E1D7] bg-[#FFFEFA] px-3 py-2 text-sm"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#153E73]" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-[#153E73]">{m.label}</span>
                    {m.open ? null : (
                      <span className="ml-2 rounded-full bg-[#FFF7E0] px-2 py-0.5 text-[11px] font-medium text-[#8A6A00]">
                        即將開放
                      </span>
                    )}
                    <span className="mt-0.5 block text-xs text-[#667085]">{m.note}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {hasUnopened ? (
          <p className="mt-2 text-xs text-[#8A6A00]">
            標示「即將開放」的方式目前還不能在結帳時選擇，現階段請選擇門市取貨。
          </p>
        ) : null}
      </div>

      {zones.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-[#153E73]">保存溫層</p>
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => (
              <span
                key={z.key}
                className="inline-flex items-center gap-1 rounded-full border border-[#E8E1D7] bg-white px-3 py-1 text-xs text-[#334155]"
              >
                {z.key === "ambient" ? (
                  <Thermometer className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Snowflake className="h-3.5 w-3.5" aria-hidden />
                )}
                {z.label}
              </span>
            ))}
          </div>
          {multiZone ? (
            // 這條規則跟結帳頁的實際限制一致（assertShipmentTemperatureCompatible）。
            <p className="mt-2 text-xs text-[#667085]">
              不同溫層的商品宅配需分開下單；門市取貨可合併。
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm leading-relaxed text-[#667085]">
        實際配送時程依庫存與門市作業時間為準。
      </p>

      {shippingNotice ? (
        <div className="rounded-xl border border-[#E8E1D7] bg-[#FFFEFA] p-3">
          <h3 className="mb-2 text-sm font-bold text-[#153E73]">配送注意事項</h3>
          {looksLikeHtml(shippingNotice) ? (
            <RichTextHtml html={shippingNotice} />
          ) : (
            <div
              className="whitespace-pre-wrap text-sm text-[#475467]"
              style={{ lineHeight: 1.7 }}
            >
              {shippingNotice}
            </div>
          )}
        </div>
      ) : null}

      <p className="text-xs text-[#667085]">
        <Link href="/support/shipping" className="font-medium text-[#153E73] underline">
          查看完整配送說明
        </Link>
      </p>
    </div>
  );
}
