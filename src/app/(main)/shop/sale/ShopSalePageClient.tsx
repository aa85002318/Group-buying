"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard, type ProductBadge } from "@/components/products/ProductCard";
import type { Product } from "@/lib/types/database";
import { shopDisplayPrice } from "@/lib/shop/home-product-rails";

export function ShopSalePageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop/sale-products?limit=24", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 py-5 md:px-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-[#153E73]">優惠商品</h1>
        <Link href="/shop" className="text-sm font-semibold text-[#153E73]">
          返回商城
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-[#687386]">載入中…</p>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-[#EEEEEE] bg-white p-6 text-sm text-[#687386]">
          目前尚無優惠商品。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => {
            const { price, original } = shopDisplayPrice(p);
            const badge: ProductBadge | undefined =
              p.status === "sold_out" || (Number(p.stock ?? 0) <= 0 && !p.allow_oversell)
                ? "soldout"
                : undefined;
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={price}
                original_price={original}
                image_url={p.image_url}
                badge={badge}
                variant="shop"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
