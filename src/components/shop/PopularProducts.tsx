"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { GroupBuyHubHeader } from "@/components/home/group-buy-hub/GroupBuyHubHeader";
import { ProductHorizontalScroller } from "@/components/home/ingredient-shop/ProductHorizontalScroller";
import {
  ShopProductRailCard,
  type ShopRailBadge,
} from "@/components/shop/ShopProductRailCard";

function resolvePrice(p: Product): { price: number; original?: number | null } {
  const price = Number(p.sale_price ?? p.website_price ?? p.price ?? 0);
  const original = p.original_price ?? p.msrp ?? null;
  return {
    price,
    original: original != null && Number(original) > price ? Number(original) : null,
  };
}

function resolveBadge(p: Product): ShopRailBadge | null {
  if (p.status === "sold_out" || (Number(p.stock ?? 0) <= 0 && !p.allow_oversell)) {
    return "soldout";
  }
  if (p.is_hot) return "hot";
  if (p.is_new) return "new";
  return null;
}

/**
 * Shop home popular products — same rail layout as homepage「一鍵買齊材料」.
 */
export function PopularProducts({
  products: productsProp,
  className,
  title = "熱門商品",
  limit = 10,
}: {
  products?: Product[];
  className?: string;
  title?: string;
  limit?: number;
}) {
  const [products, setProducts] = useState<Product[]>(productsProp ?? []);
  const [loaded, setLoaded] = useState(Boolean(productsProp));

  useEffect(() => {
    if (productsProp) {
      setProducts(productsProp);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/shop/popular-products?limit=${limit}`, { cache: "no-store" })
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
  }, [productsProp, limit]);

  if (!loaded || !products.length) return null;

  return (
    <section
      className={cn("shop-popular-products w-full bg-white", className)}
      aria-label="熱門商品"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 xl:max-w-[1320px]">
        <GroupBuyHubHeader
          title={
            <>
              <span aria-hidden>🔥 </span>{title}
            </>
          }
          href="/shop/popular"
          linkLabel="查看更多"
        />

        <ProductHorizontalScroller>
          {products.map((p) => {
            const { price, original } = resolvePrice(p);
            return (
              <ShopProductRailCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={price}
                originalPrice={original}
                imageUrl={p.image_url}
                badge={resolveBadge(p)}
              />
            );
          })}
        </ProductHorizontalScroller>
      </div>
    </section>
  );
}
