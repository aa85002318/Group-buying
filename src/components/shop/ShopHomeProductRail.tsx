"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/lib/types/database";
import { shopDisplayPrice } from "@/lib/shop/home-product-rails";
import { cn } from "@/lib/utils";
import { GroupBuyHubHeader } from "@/components/home/group-buy-hub/GroupBuyHubHeader";
import { ProductHorizontalScroller } from "@/components/home/ingredient-shop/ProductHorizontalScroller";
import {
  ShopProductRailCard,
  type ShopRailBadge,
} from "@/components/shop/ShopProductRailCard";

export function ShopHomeProductRail({
  title,
  href,
  apiUrl,
  className,
  titleExtra,
  badgeFor,
}: {
  title: string;
  href: string;
  apiUrl: string;
  className?: string;
  titleExtra?: ReactNode;
  badgeFor?: (p: Product) => ShopRailBadge | null;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.products)) setProducts(d.products);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  if (!loaded || !products.length) return null;

  return (
    <section className={cn("w-full bg-white", className)} aria-label={title}>
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 xl:max-w-[1320px]">
        <GroupBuyHubHeader
          title={
            titleExtra ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                {title}
                {titleExtra}
              </span>
            ) : (
              title
            )
          }
          href={href}
          linkLabel="查看更多"
        />
        <ProductHorizontalScroller>
          {products.map((p) => {
            const { price, original } = shopDisplayPrice(p);
            return (
              <ShopProductRailCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={price}
                originalPrice={original}
                imageUrl={p.image_url}
                badge={badgeFor?.(p) ?? null}
              />
            );
          })}
        </ProductHorizontalScroller>
      </div>
    </section>
  );
}
