"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
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
    <section className={cn("space-y-3 bg-surface", className)} aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-brand-caramel">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-touch items-center gap-0.5 text-sm font-semibold text-brand-primary"
          >
            查看全部
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      {loading ? (
        <div className="flex gap-3 overflow-hidden" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="home-skeleton h-56 w-[42%] shrink-0 rounded-[18px] sm:w-[28%] md:w-[22%]"
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
          description="稍後再來看看，或先逛逛其他精選區塊。"
          actionHref={href ?? "/products"}
          actionLabel="逛全部商品"
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none lg:grid lg:grid-cols-4 lg:overflow-visible xl:grid-cols-5">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex w-[42%] shrink-0 sm:w-[28%] md:w-[22%] lg:w-auto"
            >
              <div className="flex h-full w-full flex-col">
                <ProductCard
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  original_price={p.original_price}
                  image_url={p.image_url}
                  badge={badge}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
