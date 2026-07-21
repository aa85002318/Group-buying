"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import type { Product } from "@/lib/types/database";

type GbEvent = {
  id: string;
  title: string;
  end_at?: string | null;
  status?: string;
  cover_image?: string | null;
  group_buy_products?: Array<{
    special_price?: number | null;
    stock?: number | null;
    original_price?: number | null;
    products?: Product | null;
  }>;
};

function remainLabel(endAt?: string | null) {
  if (!endAt) return null;
  const ms = new Date(endAt).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return "已結束";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `剩 ${Math.max(1, hours)} 小時`;
  return `剩 ${Math.ceil(hours / 24)} 天`;
}

function stockProgress(stock?: number | null) {
  if (stock == null || stock < 0) return 0.4;
  if (stock === 0) return 1;
  return Math.min(1, Math.max(0.12, 1 - stock / 80));
}

/** 獨立團購卡：圖＋倒數＋價＋剩餘＋進度＋跟團；一次約 1.2–1.5 張 */
export function GroupBuyClosingSection({
  title,
  events,
  loading,
  error,
  onRetry,
}: {
  title: string;
  events: GbEvent[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <section className="space-y-3">
      <SectionHeader title={title} href="/group-buy" accentClass="bg-brand-primary" className="!mb-0" />
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && events.length === 0}
        emptyTitle="目前沒有即將收單的團購"
        emptyText="新團購開跑時會出現在這裡"
        emptyActionHref="/group-buy"
        emptyActionLabel="查看團購"
        skeletonCount={2}
      >
        <div className="flex gap-3 overflow-x-auto scrollbar-none">
          {events.map((e) => {
            const gp = e.group_buy_products?.find((x) => x.products);
            const product = gp?.products;
            const price = gp?.special_price ?? product?.price;
            const original = gp?.original_price ?? product?.original_price ?? null;
            const stock = gp?.stock ?? product?.stock;
            const remain = remainLabel(e.end_at);
            const image =
              e.cover_image || product?.image_url || null;
            const progress = stockProgress(stock);

            return (
              <Link
                key={e.id}
                href={`/group-buy/${e.id}`}
                className="flex w-[min(78vw,280px)] shrink-0 overflow-hidden rounded-[18px] border border-border-soft bg-surface"
              >
                <div className="relative w-[108px] shrink-0 bg-surface-soft">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full min-h-[132px] items-center justify-center text-[10px] text-foreground-muted">
                      團購
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {remain ? (
                      <span className="rounded-full bg-surface-coral px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                        {remain}
                      </span>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-[13px] font-bold leading-snug text-brand-caramel">
                    {e.title}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    {price != null ? (
                      <span className="text-sm font-bold text-brand-primary">
                        {formatCurrency(Number(price))}
                      </span>
                    ) : null}
                    {original != null && Number(original) > Number(price) ? (
                      <span className="text-[10px] text-foreground-muted line-through">
                        {formatCurrency(Number(original))}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] font-medium text-brand-caramel">
                    {stock != null ? `剩餘 ${stock}` : "限時團購"}
                  </p>
                  <span className="mt-0.5 block h-1.5 overflow-hidden rounded-full bg-surface-peach">
                    <span
                      className="block h-full rounded-full bg-brand-primary"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </span>
                  <span className="mt-auto inline-flex h-8 w-fit items-center rounded-button bg-brand-primary px-3 text-[11px] font-bold text-white">
                    立即跟團
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </HomeSectionFrame>
    </section>
  );
}
