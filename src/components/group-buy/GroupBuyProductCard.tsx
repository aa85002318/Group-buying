"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import {
  extractCampaignProductId,
  formatCountdownDetailed,
  formatPriceTwd,
  fulfillmentShortLabels,
  type GroupBuyPageSettings,
  type GroupBuyRuntimeStatus,
} from "@/lib/group-buy/page-settings";
import { cn } from "@/lib/utils";
import type { GroupBuyCampaignCardData } from "@/components/group-buy/GroupBuyCampaignCard";

const STATUS_UI: Record<string, { label: string; className: string }> = {
  active: { label: "熱烈開團", className: "bg-[#F16458] text-white" },
  ending_soon: { label: "即將結團", className: "bg-[#153E73] text-white" },
  upcoming: { label: "即將開團", className: "bg-[#79C7E8] text-[#153E73]" },
  ended: { label: "已結團", className: "bg-[#687386] text-white" },
  sold_out: { label: "已售罄", className: "bg-[#687386] text-white" },
};

function canPurchase(status: GroupBuyRuntimeStatus) {
  return status === "active" || status === "ending_soon";
}

function useLiveNow(enabled: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
}

export function GroupBuyProductCard({
  campaign,
  settings,
  compact = false,
  onExpire,
}: {
  campaign: GroupBuyCampaignCardData & {
    group_buy_products?: Array<{
      product_id?: string;
      products?: { id?: string } | null;
    }> | null;
  };
  settings: GroupBuyPageSettings;
  compact?: boolean;
  onExpire?: () => void;
}) {
  const f = settings.cardFields;
  const status = campaign.runtime_status;
  const image = campaign.productImage || campaign.banner_url;
  const name = campaign.productName || campaign.short_title || campaign.title;
  const href = `/group-buy/${campaign.id}`;
  const productId = extractCampaignProductId(campaign);
  const fulfillment = fulfillmentShortLabels(campaign.fulfillment_options);
  const showFulfillment = f.fulfillment ? fulfillment.slice(0, compact ? 1 : 2) : [];
  const extraFulfillment =
    f.fulfillment && fulfillment.length > showFulfillment.length
      ? fulfillment.length - showFulfillment.length
      : 0;

  const showOriginal =
    f.originalPrice &&
    campaign.originalPrice > 0 &&
    campaign.originalPrice > campaign.groupPrice;

  const hasProgressTarget =
    Boolean(campaign.threshold_type) &&
    campaign.threshold_type !== "none" &&
    Number(campaign.threshold_value) > 0 &&
    (f.progress || campaign.show_progress !== false);

  const progress = hasProgressTarget
    ? Math.min(
        100,
        Math.round(
          ((campaign.soldQuantity ?? 0) / Number(campaign.threshold_value)) * 100
        )
      )
    : null;

  const remaining =
    campaign.threshold_type &&
    campaign.threshold_type !== "none" &&
    Number(campaign.threshold_value) > 0
      ? Math.max(0, Number(campaign.threshold_value) - (campaign.soldQuantity ?? 0))
      : null;

  const showCountdown =
    Boolean(f.countdown) &&
    (status === "active" || status === "ending_soon" || status === "upcoming");
  const countdownTarget =
    status === "upcoming" ? campaign.start_at : campaign.end_at;
  const now = useLiveNow(showCountdown);
  const countdown = showCountdown
    ? formatCountdownDetailed(countdownTarget, now)
    : null;

  useEffect(() => {
    if (countdown?.expired) onExpire?.();
  }, [countdown?.expired, onExpire]);

  const statusUi = STATUS_UI[status];

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl bg-white",
        "shadow-[0_6px_20px_rgba(21,62,115,0.08)]"
      )}
    >
      <div className="relative aspect-square w-full bg-[#EEF8FC]">
        <Link href={href} className="absolute inset-0" aria-label={name}>
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes={compact ? "180px" : "(max-width:768px) 50vw, 25vw"}
              unoptimized
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-[#687386]">
              暫無圖片
            </span>
          )}
        </Link>
        {f.status && statusUi ? (
          <span
            className={cn(
              "pointer-events-none absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold",
              statusUi.className
            )}
          >
            {statusUi.label}
          </span>
        ) : null}
        {productId ? (
          <div className="absolute right-2 top-2 z-10">
            <FavoriteButton
              targetType="product"
              targetId={productId}
              size="sm"
              className="!h-11 !w-11 !border !border-[#E9EDF2] !bg-white/95 !shadow-none"
            />
          </div>
        ) : null}
        {compact && countdown && !countdown.expired ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#153E73]/80 to-transparent px-2 pb-2 pt-6">
            <p className="text-[11px] font-semibold text-white">{countdown.text}</p>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-1.5 p-3 min-[360px]:p-3.5",
          compact && "p-2.5"
        )}
      >
        {f.name ? (
          <Link href={href}>
            <h3
              className={cn(
                "line-clamp-2 font-semibold text-[#153E73]",
                compact ? "text-[13px] leading-snug" : "text-[15px] leading-snug md:text-base"
              )}
            >
              {name}
            </h3>
          </Link>
        ) : null}

        {!compact && f.spec && campaign.productSpec ? (
          <p className="line-clamp-1 text-xs text-[#687386]">{campaign.productSpec}</p>
        ) : null}

        <div className="mt-auto space-y-1.5">
          {f.groupPrice ? (
            <div className="flex flex-wrap items-baseline gap-1.5">
              {!compact ? (
                <span className="text-[12px] font-medium text-[#F16458]">團購價</span>
              ) : null}
              <span
                className={cn(
                  "font-bold text-[#F16458]",
                  compact ? "text-lg" : "text-xl md:text-2xl"
                )}
              >
                {formatPriceTwd(campaign.groupPrice)}
              </span>
              {showOriginal ? (
                <span className="text-[13px] text-[#8A94A3] line-through">
                  {formatPriceTwd(campaign.originalPrice)}
                </span>
              ) : null}
            </div>
          ) : null}

          {!campaign.statsHidden && f.soldQuantity ? (
            <p className="text-[11px] text-[#687386]">
              已售 {campaign.soldQuantity ?? 0}
              {progress != null ? ` · ${progress}%` : ""}
              {remaining != null ? ` · 剩餘 ${remaining}` : ""}
            </p>
          ) : null}

          {progress != null ? (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-[#EEF1F4]"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="團購進度"
            >
              <div
                className="h-full rounded-full bg-[#F16458]"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}

          {!compact && countdown ? (
            <p
              className={cn(
                "text-xs font-medium",
                status === "ending_soon" || countdown.urgent
                  ? "text-[#F16458]"
                  : "text-[#687386]"
              )}
            >
              {countdown.text}
            </p>
          ) : null}

          {showFulfillment.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {showFulfillment.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[#E9EDF2] px-2 py-0.5 text-[10px] font-medium text-[#153E73]"
                >
                  {label}
                </span>
              ))}
              {extraFulfillment > 0 ? (
                <span className="rounded-full border border-[#E9EDF2] px-2 py-0.5 text-[10px] text-[#687386]">
                  +{extraFulfillment}
                </span>
              ) : null}
            </div>
          ) : null}

          {!compact && f.actionButton && canPurchase(status) ? (
            <Link
              href={href}
              className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#F16458] text-sm font-bold text-white transition hover:bg-[#e05549] active:scale-[0.98]"
              aria-label={`立即跟團：${name}`}
            >
              立即跟團
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
