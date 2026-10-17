"use client";

import { HomeProductRailCard } from "@/components/home/HomeProductRailCard";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import {
  HOME_SECTION_INSET,
  HomeYellowSectionHeader,
} from "@/components/home/HomeYellowSectionHeader";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";

type HorizontalProductRailProps = {
  title: string;
  subtitle?: string | null;
  href?: string;
  products: Product[];
  badge?: "new" | "hot";
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function HorizontalProductRail({
  title,
  subtitle,
  href,
  products,
  badge,
  className,
  loading,
  error,
  onRetry,
}: HorizontalProductRailProps) {
  return (
    <section className={cn("bg-white pb-7 pt-0 md:pb-10", className)} aria-label={title}>
      <div className={HOME_SECTION_INSET}>
        <HomeYellowSectionHeader title={title} subtitle={subtitle} href={href} />
        {loading ? (
          <div className="flex gap-2.5 overflow-hidden" aria-busy>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="home-skeleton h-[240px] w-[150px] shrink-0 rounded-[16px] min-[375px]:w-[158px]"
              />
            ))}
          </div>
        ) : error ? (
          <HomeEmptyState
            compact
            title="商品暫時無法載入"
            description={error}
            actionLabel="重新整理"
            onAction={onRetry}
          />
        ) : products.length === 0 ? (
          <HomeEmptyState
            compact
            title="尚無商品"
            description="稍後再來看看精選商品。"
            actionHref={href ?? "/products"}
            actionLabel="逛全部商品"
          />
        ) : (
          <HorizontalScroller className="flex gap-2.5 overflow-x-auto md:gap-3 md:overflow-visible lg:grid lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <HomeProductRailCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={Number(p.price)}
                originalPrice={p.original_price}
                imageUrl={p.image_url}
                badge={badge}
              />
            ))}
          </HorizontalScroller>
        )}
      </div>
    </section>
  );
}
