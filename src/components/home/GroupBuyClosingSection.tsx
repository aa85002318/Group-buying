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
  if (stock == null || stock < 0) return 0.35;
  if (stock === 0) return 1;
  // Soft visual: fewer left → fuller urgency bar (cap at 100)
  return Math.min(1, Math.max(0.15, 1 - stock / 100));
}

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
    <section className="space-y-3 bg-surface">
      <SectionHeader title={title} href="/group-buy" accentClass="bg-brand-primary" />
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && events.length === 0}
        emptyTitle="目前沒有即將收單的團購"
        emptyText="新團購開跑時會出現在這裡，先去看看進行中的活動。"
        emptyActionHref="/group-buy"
        emptyActionLabel="查看全部團購"
      >
        <ul className="space-y-3">
          {events.map((e) => {
            const gp = e.group_buy_products?.find((x) => x.products);
            const price = gp?.special_price ?? gp?.products?.price;
            const original =
              gp?.original_price ?? gp?.products?.original_price ?? null;
            const stock = gp?.stock ?? gp?.products?.stock;
            const remain = remainLabel(e.end_at);
            const progress = stockProgress(stock);
            return (
              <li key={e.id}>
                <Link
                  href={`/group-buy/${e.id}`}
                  className="card-lift block rounded-[20px] border border-border-soft bg-surface p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-brand-caramel">
                          {e.title}
                        </span>
                        {remain ? (
                          <span className="rounded-full bg-surface-coral px-2 py-0.5 text-[11px] font-bold text-brand-primary">
                            {remain}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-brand-caramel">
                        {stock != null ? `剩餘數量 ${stock}` : "限時團購"}
                      </span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-peach">
                        <span
                          className="block h-full rounded-full bg-brand-primary transition-[width] duration-200"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      {price != null ? (
                        <span className="text-right">
                          <span className="block font-bold text-brand-primary">
                            {formatCurrency(Number(price))}
                          </span>
                          {original != null && Number(original) > Number(price) ? (
                            <span className="text-xs text-foreground-muted line-through">
                              {formatCurrency(Number(original))}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                      <span className="rounded-button bg-brand-primary px-3 py-1.5 text-xs font-bold text-white">
                        立即跟團
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </HomeSectionFrame>
    </section>
  );
}
