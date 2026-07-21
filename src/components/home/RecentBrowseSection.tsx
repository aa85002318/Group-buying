"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import {
  BROWSE_TYPE_LABEL,
  type BrowseHistoryItem,
  type BrowseItemType,
} from "@/lib/home/browse-history";
import { APP_ROUTES } from "@/lib/site-links";
import { formatCurrency, cn } from "@/lib/utils";

function remainingLabel(endAt?: string | null): string | null {
  if (!endAt) return null;
  const ms = new Date(endAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "已結束";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `剩 ${Math.max(1, hours)} 小時`;
  const days = Math.ceil(hours / 24);
  return `剩 ${days} 天`;
}

function favoriteProps(type: BrowseItemType, id: string) {
  if (type === "product") return { targetType: "product" as const, targetId: id };
  if (type === "recipe") return { targetType: "recipe" as const, targetId: id };
  return null;
}

function BrowseCard({ item }: { item: BrowseHistoryItem }) {
  const fav = favoriteProps(item.type, item.id);
  const remain = item.type === "group_buy" ? remainingLabel(item.endAt) : null;

  return (
    <article className="card-lift relative flex w-[148px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-border-soft bg-surface md:w-auto">
      <Link href={item.href} className="block">
        <div className="relative aspect-square bg-surface-soft">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
              暫無圖片
            </div>
          )}
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold",
              item.type === "product" && "bg-surface-coral text-brand-primary",
              item.type === "recipe" && "bg-surface-yellow text-brand-caramel",
              item.type === "group_buy" && "bg-surface-peach text-brand-caramel"
            )}
          >
            {BROWSE_TYPE_LABEL[item.type]}
          </span>
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-2 text-sm font-semibold text-brand-caramel">{item.title}</p>
          {item.type === "product" && item.price != null ? (
            <p className="text-sm font-bold text-brand-primary">
              {formatCurrency(Number(item.price))}
            </p>
          ) : null}
          {remain ? <p className="text-xs font-medium text-brand-primary">{remain}</p> : null}
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-soft px-2 py-2">
        {fav ? (
          <FavoriteButton {...fav} size="sm" className="!h-8 !w-8" />
        ) : (
          <span className="h-8 w-8" />
        )}
        <Link
          href={item.href}
          className="rounded-button bg-primary-soft px-2.5 py-1.5 text-xs font-bold text-brand-primary"
        >
          再次查看
        </Link>
      </div>
    </article>
  );
}

type RecentBrowseSectionProps = {
  items: BrowseHistoryItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  limit?: number;
  moreHref?: string;
  showGuestEmpty?: boolean;
};

export function RecentBrowseSection({
  items,
  loading,
  error,
  onRetry,
  limit = 5,
  moreHref = "/member/recent",
  showGuestEmpty = false,
}: RecentBrowseSectionProps) {
  const shown = items.slice(0, limit);
  const isGuestEmpty = showGuestEmpty && shown.length === 0;

  return (
    <section className="space-y-3 bg-surface">
      <div>
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-yellow" aria-hidden />
              最近瀏覽
            </span>
          }
          href={moreHref}
          linkLabel="查看更多"
        />
      </div>
      {isGuestEmpty && !loading && !error ? (
        <HomeEmptyState
          compact
          icon={Clock}
          title="登入後查看最近瀏覽"
          description="快速接續你看過的商品、食譜與團購。"
          actionHref={APP_ROUTES.login}
          actionLabel="立即登入"
        />
      ) : (
        <HomeSectionFrame
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={!loading && !error && shown.length === 0}
          emptyTitle="還沒有瀏覽紀錄"
          emptyText="去逛逛熱門商品、食譜或團購，這裡會幫你記住。"
          emptyActionHref="/products"
          emptyActionLabel="去逛逛熱門商品"
        >
          <div
            className={cn(
              "flex gap-3 overflow-x-auto pb-1 scrollbar-none",
              "md:grid md:grid-cols-5 md:overflow-visible"
            )}
          >
            {shown.map((item) => (
              <BrowseCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        </HomeSectionFrame>
      )}
    </section>
  );
}
