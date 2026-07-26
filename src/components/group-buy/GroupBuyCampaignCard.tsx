"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatCountdown,
  formatPriceTwd,
  fulfillmentShortLabels,
  type GroupBuyPageSettings,
  type GroupBuyRuntimeStatus,
} from "@/lib/group-buy/page-settings";
import { cn } from "@/lib/utils";

export type GroupBuyCampaignCardData = {
  id: string;
  title: string;
  short_title?: string | null;
  banner_url?: string | null;
  start_at: string;
  end_at: string;
  runtime_status: GroupBuyRuntimeStatus;
  groupPrice: number;
  originalPrice: number;
  savings: number | null;
  soldQuantity?: number;
  participantCount?: number;
  productName?: string;
  productImage?: string | null;
  productSpec?: string | null;
  fulfillment_options?: unknown;
  manual_tags?: string[] | null;
  threshold_type?: string | null;
  threshold_value?: number | null;
  show_progress?: boolean | null;
};

const STATUS_TEXT: Record<string, string> = {
  active: "進行中",
  ending_soon: "即將結團",
  upcoming: "即將開團",
  ended: "已結團",
  sold_out: "已售罄",
};

function canPurchase(status: GroupBuyRuntimeStatus) {
  return status === "active" || status === "ending_soon";
}

export function GroupBuyCampaignCard({
  campaign,
  settings,
}: {
  campaign: GroupBuyCampaignCardData;
  settings: GroupBuyPageSettings;
}) {
  const f = settings.cardFields;
  const status = campaign.runtime_status;
  const btnKey =
    status === "ending_soon"
      ? "ending_soon"
      : status === "upcoming"
        ? "upcoming"
        : status === "ended"
          ? "ended"
          : status === "sold_out"
            ? "sold_out"
            : "active";
  const buttonLabel = settings.buttonLabels[btnKey];
  const disabled = !canPurchase(status) && status !== "upcoming";
  const image = campaign.productImage || campaign.banner_url;
  const name = campaign.productName || campaign.short_title || campaign.title;
  const tags = [
    ...(status === "sold_out" || status === "ended" || status === "ending_soon" || status === "upcoming"
      ? [STATUS_TEXT[status]]
      : []),
    ...((campaign.manual_tags ?? []).slice(0, 2)),
  ].slice(0, 3);
  const fulfillment = fulfillmentShortLabels(campaign.fulfillment_options);

  const showOriginal =
    f.originalPrice &&
    campaign.originalPrice > 0 &&
    campaign.originalPrice > campaign.groupPrice;
  const showSavings =
    f.savings &&
    campaign.savings != null &&
    campaign.savings > 0 &&
    campaign.originalPrice > campaign.groupPrice;

  const progress =
    f.progress &&
    campaign.show_progress &&
    campaign.threshold_type &&
    campaign.threshold_type !== "none" &&
    Number(campaign.threshold_value) > 0
      ? Math.min(
          100,
          Math.round(
            ((campaign.soldQuantity ?? 0) / Number(campaign.threshold_value)) * 100
          )
        )
      : null;

  return (
    <Link
      href={`/group-buy/${campaign.id}`}
      className={cn(
        "block overflow-hidden rounded-[18px] border border-border bg-white shadow-card transition hover:border-groupBuy/40",
        disabled && "opacity-70"
      )}
    >
      {f.image && (
        <div className="relative aspect-[16/10] w-full bg-groupBuy-soft">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 360px"
              unoptimized
            />
          ) : null}
          {f.status && (
            <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white">
              {STATUS_TEXT[status] ?? status}
            </span>
          )}
        </div>
      )}

      <div className="space-y-2 p-4">
        {f.tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground-secondary"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {f.name && <h3 className="line-clamp-2 text-base font-bold text-foreground">{name}</h3>}
        {f.spec && campaign.productSpec && (
          <p className="text-xs text-foreground-secondary">{campaign.productSpec}</p>
        )}

        <div className="flex flex-wrap items-end gap-2">
          {f.groupPrice && (
            <span className="text-xl font-black text-groupBuy">
              {formatPriceTwd(campaign.groupPrice)}
            </span>
          )}
          {showOriginal && (
            <span className="text-sm text-foreground-muted line-through">
              {formatPriceTwd(campaign.originalPrice)}
            </span>
          )}
          {showSavings && (
            <span className="text-xs font-semibold text-foreground">
              現省 {formatPriceTwd(campaign.savings!)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground-secondary">
          {f.endDate && (
            <span>結團 {new Date(campaign.end_at).toLocaleDateString("zh-TW")}</span>
          )}
          {f.countdown && (status === "active" || status === "ending_soon") && (
            <span>倒數 {formatCountdown(campaign.end_at)}</span>
          )}
          {f.countdown && status === "upcoming" && (
            <span>開團 {formatCountdown(campaign.start_at)}</span>
          )}
          {f.participantCount && (
            <span>已跟團 {campaign.participantCount ?? 0} 人</span>
          )}
          {f.soldQuantity && <span>已售 {campaign.soldQuantity ?? 0} 件</span>}
        </div>

        {progress != null && (
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-foreground-secondary">
              <span>團購進度</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-groupBuy" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {f.fulfillment && fulfillment.length > 0 && (
          <p className="text-xs text-foreground-secondary">{fulfillment.join(" · ")}</p>
        )}

        {f.actionButton && (
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-3 py-1.5 text-xs font-bold",
              canPurchase(status) || status === "upcoming"
                ? "bg-groupBuy text-white"
                : "bg-disabled text-white"
            )}
          >
            {buttonLabel}
          </span>
        )}
      </div>
    </Link>
  );
}
