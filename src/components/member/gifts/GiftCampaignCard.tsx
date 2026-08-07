"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GiftMemberUiStatus } from "@/lib/gifts/types";

export type GiftCampaignCardData = {
  id: string;
  name: string;
  gift_name: string;
  gift_image_url?: string | null;
  campaign_type: string;
  tag_label?: string | null;
  description?: string | null;
  terms?: string | null;
  per_member_limit: number;
  available_quantity: number | null;
  total_quantity: number;
  claim_start_at?: string | null;
  claim_end_at?: string | null;
  redeem_end_at?: string | null;
  minimum_spend?: number | null;
  redemption_stores?: Array<{ id: string; name: string }>;
  member_status: GiftMemberUiStatus;
  member_status_label: string;
  claim?: { id: string; status: string } | null;
};

const STATUS_TONE: Partial<Record<GiftMemberUiStatus, string>> = {
  claimable: "bg-[#E8F8EF] text-[#1B6B3A]",
  redeemable: "bg-[#FFF5CC] text-[#153E73]",
  claimed: "bg-[#EEF8FC] text-[#153E73]",
  redeemed: "bg-[#F3F4F6] text-[#6B7280]",
  exhausted: "bg-[#F3F4F6] text-[#6B7280]",
  sold_out: "bg-[#F3F4F6] text-[#6B7280]",
  expired: "bg-[#FDE8E6] text-[#B42318]",
  ineligible: "bg-[#FDE8E6] text-[#B42318]",
  not_started: "bg-[#EEF8FC] text-[#153E73]",
  disabled: "bg-[#F3F4F6] text-[#6B7280]",
};

function formatRange(a?: string | null, b?: string | null) {
  const fmt = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };
  const s = fmt(a);
  const e = fmt(b);
  if (s && e) return `${s} – ${e}`;
  return s || e || "—";
}

export function GiftCampaignCard({
  item,
  onClaim,
  claiming,
  compact,
}: {
  item: GiftCampaignCardData;
  onClaim?: (campaignId: string) => void;
  claiming?: boolean;
  compact?: boolean;
}) {
  const exhausted =
    item.member_status === "exhausted" || item.member_status === "sold_out";
  const storeLabel =
    item.redemption_stores?.map((s) => s.name).join("、") || "指定門市";

  let action: React.ReactNode = null;
  if (item.member_status === "claimable" && onClaim) {
    action = (
      <button
        type="button"
        disabled={claiming}
        onClick={() => onClaim(item.id)}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#FEE169] text-sm font-bold text-[#153E73] disabled:opacity-50"
      >
        {claiming ? "領取中…" : "立即領取"}
      </button>
    );
  } else if (
    item.member_status === "redeemable" ||
    item.member_status === "claimed"
  ) {
    const href = item.claim?.id
      ? `/member/benefits/vouchers/${item.claim.id}`
      : "/member/benefits/vouchers";
    action = (
      <Link
        href={href}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#153E73] text-sm font-bold text-white"
      >
        出示兌換條碼
      </Link>
    );
  } else if (exhausted) {
    action = (
      <Link
        href="/member/benefits"
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#E8E1D7] text-sm font-bold text-[#153E73]"
      >
        查看其他會員活動
      </Link>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E8E1D7] bg-white shadow-[0_8px_20px_rgba(21,62,115,0.04)]",
        exhausted && "grayscale-[0.7] opacity-75"
      )}
    >
      <div className={cn("relative bg-[#FFFEFA]", compact ? "aspect-[16/9]" : "aspect-[5/2]")}>
        {item.gift_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.gift_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#687386]">
            {item.gift_name}
          </div>
        )}
        {exhausted ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-[#153E73]">
              兌換完畢
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#FFF5CC] px-2 py-0.5 text-[11px] font-semibold text-[#153E73]">
            {item.tag_label ||
              (item.campaign_type === "store_spend_gift" ? "門市滿額贈" : "本月會員禮")}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              STATUS_TONE[item.member_status] ?? "bg-[#F3F4F6] text-[#6B7280]"
            )}
          >
            {item.member_status_label}
          </span>
        </div>
        <h3 className="text-base font-bold text-[#153E73]">{item.gift_name}</h3>
        {item.description ? (
          <p className="text-xs text-[#687386]">{item.description}</p>
        ) : null}

        <dl className="space-y-1 text-xs text-[#687386]">
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-[#153E73]">兌換條件</dt>
            <dd>
              {item.minimum_spend
                ? `單筆實付滿 NT$${Number(item.minimum_spend).toLocaleString()}`
                : item.terms || "一般會員即可兌換"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-[#153E73]">兌換數量</dt>
            <dd>每位會員限兌換 {item.per_member_limit} 份</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-[#153E73]">指定門市</dt>
            <dd>{storeLabel}</dd>
          </div>
          {item.available_quantity != null ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-[#153E73]">剩餘數量</dt>
              <dd>
                剩餘 {item.available_quantity} 份（共 {item.total_quantity}）
              </dd>
            </div>
          ) : null}
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-[#153E73]">活動期間</dt>
            <dd>{formatRange(item.claim_start_at, item.redeem_end_at || item.claim_end_at)}</dd>
          </div>
        </dl>

        {exhausted ? (
          <div className="rounded-xl bg-[#FFFEFA] px-3 py-2 text-xs text-[#687386]">
            <p className="font-bold text-[#153E73]">本月會員禮已兌換完畢</p>
            <p>本月限量會員禮已全數兌換，敬請期待下個月的新禮物！</p>
          </div>
        ) : null}

        {action}
      </div>
    </article>
  );
}
