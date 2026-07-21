"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type HorizontalProductRailProps = {
  title: string;
  href?: string;
  products: Product[];
  badge?: "new" | "hot";
  className?: string;
  loading?: boolean;
};

export function HorizontalProductRail({
  title,
  href,
  products,
  badge,
  className,
  loading,
}: HorizontalProductRailProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
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
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 w-[42%] shrink-0 animate-pulse rounded-[20px] bg-surface-peach sm:w-[28%]"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-border bg-section p-6 text-center text-sm text-foreground-secondary">
          尚無商品，稍後再來看看
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {products.map((p) => (
            <div key={p.id} className="w-[42%] shrink-0 sm:w-[28%] md:w-[22%] lg:w-[18%]">
              <ProductCard
                id={p.id}
                name={p.name}
                price={Number(p.price)}
                original_price={p.original_price}
                image_url={p.image_url}
                badge={badge}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
