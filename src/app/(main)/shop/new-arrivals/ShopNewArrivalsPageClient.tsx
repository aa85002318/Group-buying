"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard, type ProductBadge } from "@/components/products/ProductCard";
import type { Product } from "@/lib/types/database";

function resolvePrice(p: Product): { price: number; original?: number | null } {
  const price = Number(p.sale_price ?? p.website_price ?? p.price ?? 0);
  const original = p.original_price ?? p.msrp ?? null;
  return {
    price,
    original: original != null && Number(original) > price ? Number(original) : null,
  };
}

export function ShopNewArrivalsPageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop/new-products?limit=24", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 py-5 md:px-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#153E73]">
          新品上架
          <span className="rounded-[6px] bg-[#FF8A3D] px-1.5 py-0.5 text-xs font-bold leading-none text-white">
            NEW
          </span>
        </h1>
        <Link href="/shop" className="text-sm font-semibold text-[#153E73]">
          返回商城
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-[#687386]">載入中…</p>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-[#EEEEEE] bg-white p-6 text-sm text-[#687386]">
          目前尚無新品。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => {
            const { price, original } = resolvePrice(p);
            const badge: ProductBadge =
              p.status === "sold_out" || (Number(p.stock ?? 0) <= 0 && !p.allow_oversell)
                ? "soldout"
                : "new";
            const brand = p.brands?.name?.trim();
            const spec = (p.package_spec || p.unit || "").trim();
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={price}
                original_price={original}
                image_url={p.image_url}
                brandOrSpec={brand && spec ? `${brand} · ${spec}` : brand || spec || null}
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
