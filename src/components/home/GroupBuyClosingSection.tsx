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
      <SectionHeader title={title} href="/group-buy" accentClass="bg-brand-primary" />
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!loading && !error && events.length === 0}
        emptyText="目前沒有即將收單的團購"
      >
        <ul className="space-y-2">
          {events.map((e) => {
            const gp = e.group_buy_products?.find((x) => x.products);
            const price = gp?.special_price ?? gp?.products?.price;
            const stock = gp?.stock ?? gp?.products?.stock;
            const remain = remainLabel(e.end_at);
            return (
              <li key={e.id}>
                <Link
                  href={`/group-buy/${e.id}`}
                  className="flex items-center justify-between gap-3 rounded-[20px] border border-border bg-surface p-3 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-brand-caramel">{e.title}</span>
                      {remain ? (
                        <span className="rounded-full bg-surface-coral px-2 py-0.5 text-[11px] font-bold text-brand-primary">
                          {remain}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-foreground-secondary">
                      {stock != null ? `剩餘 ${stock}` : "限時團購"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {price != null ? (
                      <span className="font-bold text-brand-primary">
                        {formatCurrency(Number(price))}
                      </span>
                    ) : null}
                    <span className="rounded-button bg-brand-primary px-3 py-1.5 text-xs font-bold text-white">
                      立即跟團
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </HomeSectionFrame>
    </section>
  );
}
