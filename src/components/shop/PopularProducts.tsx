"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard, type ProductBadge } from "@/components/products/ProductCard";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";

function resolvePrice(p: Product): { price: number; original?: number | null } {
  const price = Number(p.sale_price ?? p.website_price ?? p.price ?? 0);
  const original = p.original_price ?? p.msrp ?? null;
  return {
    price,
    original: original != null && Number(original) > price ? Number(original) : null,
  };
}

function resolveBadge(p: Product): ProductBadge | undefined {
  if (p.status === "sold_out" || (Number(p.stock ?? 0) <= 0 && !p.allow_oversell)) {
    return "soldout";
  }
  if (p.is_new) return "new";
  if (p.is_popular || p.is_hot) return "hot";
  return undefined;
}

function brandOrSpec(p: Product): string | null {
  const brand = p.brands?.name?.trim();
  const spec = (p.package_spec || p.unit || p.specifications || "").trim();
  if (brand && spec) return `${brand} · ${spec}`;
  return brand || spec || null;
}

/**
 * Shop home popular products — horizontal rail under promo carousel.
 */
export function PopularProducts({
  products: productsProp,
  className,
}: {
  products?: Product[];
  className?: string;
}) {
  const [products, setProducts] = useState<Product[]>(productsProp ?? []);

  useEffect(() => {
    if (productsProp) {
      setProducts(productsProp);
      return;
    }
    let cancelled = false;
    fetch("/api/shop/popular-products?limit=10", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.products)) setProducts(d.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productsProp]);

  if (!products.length) return null;

  return (
    <section
      className={cn("shop-popular-products w-full bg-white", className)}
      aria-label="熱門商品"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#153E73] md:text-xl">
            <span aria-hidden>🔥 </span>熱門商品
          </h2>
          <Link
            href="/shop/popular"
            className="inline-flex min-h-10 items-center text-sm font-semibold text-[#153E73]"
          >
            查看更多 ＞
          </Link>
        </div>

        <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 md:gap-4">
          {products.map((p) => {
            const { price, original } = resolvePrice(p);
            return (
              <div
                key={p.id}
                className="w-[158px] shrink-0 sm:w-[165px] md:w-[200px] lg:w-[210px]"
              >
                <ProductCard
                  id={p.id}
                  name={p.name}
                  price={price}
                  original_price={original}
                  image_url={p.image_url}
                  brandOrSpec={brandOrSpec(p)}
                  badge={resolveBadge(p)}
                  variant="shop"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
