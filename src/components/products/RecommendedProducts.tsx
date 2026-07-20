"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/lib/types/database";

interface RecommendedProductsProps {
  productId: string;
}

/** 手機一列四格：含 gap 的單卡寬度 */
const MOBILE_CARD_WIDTH = "calc((100% - 0.75rem * 3) / 4)";

export function RecommendedProducts({ productId }: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ progress: 0, thumbRatio: 1 });

  const updateScrollTrack = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollState({ progress: 0, thumbRatio: 1 });
      return;
    }

    const thumbRatio = Math.min(1, el.clientWidth / el.scrollWidth);
    const progress = el.scrollLeft / maxScroll;
    setScrollState({ progress, thumbRatio });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}/related`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.products)) setProducts(d.products.slice(0, 4));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    updateScrollTrack();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateScrollTrack);
    observer.observe(el);
    return () => observer.disconnect();
  }, [products, loading, updateScrollTrack]);

  if (loading) {
    return (
      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-bold text-coffee">推薦商品</h2>
        <div className="flex gap-3 overflow-hidden md:grid md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square shrink-0 animate-pulse rounded-xl bg-muted md:shrink"
              style={{ width: MOBILE_CARD_WIDTH, minWidth: MOBILE_CARD_WIDTH }}
            />
          ))}
        </div>
        <div className="mx-auto h-1 w-28 rounded-full bg-muted md:hidden" />
      </section>
    );
  }

  if (products.length === 0) return null;

  const thumbWidthPercent = scrollState.thumbRatio * 100;
  const thumbLeftPercent = scrollState.progress * (100 - thumbWidthPercent);

  return (
    <section className="space-y-3 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-coffee">推薦商品</h2>
        <Link href="/products" className="text-sm text-primary hover:underline">
          查看更多
        </Link>
      </div>

      {/* 手機：橫向滑動四格並排 */}
      <div
        ref={scrollRef}
        onScroll={updateScrollTrack}
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:snap-none"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="shrink-0 snap-start md:shrink"
            style={{ width: MOBILE_CARD_WIDTH, minWidth: MOBILE_CARD_WIDTH }}
          >
            <ProductCard
              id={p.id}
              name={p.name}
              price={p.price}
              original_price={p.original_price}
              image_url={p.image_url}
              groupBuyLabel={
                p.original_price != null && p.original_price > p.price ? "限時優惠" : undefined
              }
            />
          </div>
        ))}
      </div>

      {/* 手機滑軌 */}
      <div
        className="mx-auto flex h-1.5 w-28 items-center rounded-full bg-border px-0.5 md:hidden"
        aria-hidden
      >
        <div
          className="h-1 rounded-full bg-primary transition-[width,margin-left] duration-150 ease-out"
          style={{
            width: `${thumbWidthPercent}%`,
            marginLeft: `${thumbLeftPercent}%`,
          }}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground md:hidden">左右滑動查看更多</p>
    </section>
  );
}
