"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HomeProductRailCard } from "@/components/home/HomeProductRailCard";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";

type HorizontalProductRailProps = {
  title: string;
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
  href,
  products,
  badge,
  className,
  loading,
  error,
  onRetry,
}: HorizontalProductRailProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-brand-caramel">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-primary"
          >
            查看全部
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      {loading ? (
        <div className="flex gap-2.5 overflow-hidden" aria-busy>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="home-skeleton h-[240px] w-[150px] shrink-0 rounded-[16px] min-[375px]:w-[158px]" />
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
        <HorizontalScroller className="md:grid md:grid-cols-3 md:gap-4 md:overflow-visible lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <HomeProductRailCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={Number(p.price)}
              originalPrice={p.original_price}
              imageUrl={p.image_url}
              spec={p.unit ?? p.subtitle ?? null}
              badge={badge}
            />
          ))}
        </HorizontalScroller>
      )}
    </section>
  );
}
