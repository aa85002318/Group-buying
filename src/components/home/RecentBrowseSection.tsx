"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import {
  BROWSE_TYPE_LABEL,
  type BrowseHistoryItem,
} from "@/lib/home/browse-history";
import { APP_ROUTES } from "@/lib/site-links";
import { formatCurrency, cn } from "@/lib/utils";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";

function BrowseCard({ item }: { item: BrowseHistoryItem }) {
  return (
    <Link
      href={item.href}
      className="flex w-[128px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-border-soft bg-surface min-[375px]:w-[136px] sm:w-[144px] md:w-auto"
    >
      <div className="relative aspect-square bg-surface-soft">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-foreground-muted">
            暫無圖片
          </div>
        )}
        <span
          className={cn(
            "absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            item.type === "product" && "bg-surface-coral text-brand-primary",
            item.type === "recipe" && "bg-surface-yellow text-brand-caramel",
            item.type === "group_buy" && "bg-surface-peach text-brand-caramel"
          )}
        >
          {BROWSE_TYPE_LABEL[item.type]}
        </span>
      </div>
      <div className="space-y-0.5 p-2">
        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-brand-caramel">
          {item.title}
        </p>
        {item.type === "product" && item.price != null ? (
          <p className="text-[12px] font-bold text-brand-primary">
            {formatCurrency(Number(item.price))}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

type RecentBrowseSectionProps = {
  items: BrowseHistoryItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  limit?: number;
  showGuestEmpty?: boolean;
};

export function RecentBrowseSection({
  items,
  loading,
  error,
  onRetry,
  limit = 8,
  showGuestEmpty = false,
}: RecentBrowseSectionProps) {
  const shown = items.slice(0, limit);

  return (
    <section className="space-y-3">
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-yellow" aria-hidden />
            最近瀏覽
          </span>
        }
        href="/member/recent"
        linkLabel="更多"
        className="!mb-0"
      />

      {showGuestEmpty && shown.length === 0 && !loading && !error ? (
        <Link
          href={APP_ROUTES.login}
          className="flex h-[96px] items-center gap-3 rounded-[16px] border border-border-soft bg-surface-soft px-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-yellow text-brand-yellow">
            <Clock className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-brand-caramel">
              登入後查看最近瀏覽
            </span>
            <span className="mt-0.5 block text-xs text-foreground-secondary">
              快速接續商品、食譜與團購
            </span>
          </span>
          <span className="shrink-0 rounded-button bg-brand-primary px-3 py-2 text-xs font-bold text-white">
            登入
          </span>
        </Link>
      ) : (
        <HomeSectionFrame
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={!loading && !error && shown.length === 0}
          emptyTitle="還沒有瀏覽紀錄"
          emptyText="去逛逛熱門商品吧"
          emptyActionHref="/products"
          emptyActionLabel="去逛逛"
          skeletonCount={3}
        >
          <HorizontalScroller className="md:grid md:grid-cols-4 md:gap-4 md:overflow-visible lg:grid-cols-5">
            {shown.map((item) => (
              <BrowseCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </HorizontalScroller>
        </HomeSectionFrame>
      )}
    </section>
  );
}
