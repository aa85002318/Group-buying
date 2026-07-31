"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShopHeroBanner } from "@/components/shop/ShopHeroBanner";
import { ShopSearchBar } from "@/components/shop/ShopSearchBar";
import { ShopCategoryMenu } from "@/components/shop/ShopCategoryMenu";
import { ShopPromoCarousel } from "@/components/shop/ShopPromoCarousel";
import {
  NewProductsSection,
  PopularProductsSection,
} from "@/components/home/NewProductsSection";
import { getNewThisWeekProducts } from "@/lib/home";
import { mockProducts } from "@/lib/mock-data";
import { APP_ROUTES } from "@/lib/site-links";
import type { Product } from "@/lib/types/database";

export function ShopHubClient() {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  useEffect(() => {
    fetch("/api/products?scope=baking&channel=website")
      .then((r) => r.json())
      .then((p) => {
        if (p.products?.length) setProducts(p.products);
      })
      .catch(() => {});
  }, []);

  const newest = useMemo(() => getNewThisWeekProducts(products), [products]);
  const popular = useMemo(() => products.slice(0, 8), [products]);

  return (
    <div className="shop-hub space-y-0 bg-white">
      <ShopHeroBanner />

      <div className="shop-search-bar-wrap">
        <ShopSearchBar />
      </div>

      <ShopCategoryMenu />

      <div className="mx-auto max-w-[1200px] px-4 pb-7 pt-0">
        <ShopPromoCarousel />
      </div>

      <div className="shop-hub-body mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-0 md:px-6">
        <PopularProductsSection
          products={popular}
          href={APP_ROUTES.bakingMaterials}
          title="熱門商品"
        />

        <NewProductsSection
          products={newest}
          href={`${APP_ROUTES.bakingMaterials}?sort=newest`}
          title="新品上架"
        />

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/stores"
            className="rounded-[16px] border border-[#EAEAEA] bg-white p-4 text-[#153E73] shadow-[0_4px_14px_rgba(21,62,115,0.06)]"
          >
            <h3 className="font-bold">門市取貨</h3>
            <p className="mt-1 text-sm text-[#687386]">線上下單，就近門市取貨</p>
          </Link>
          <Link
            href="/corporate"
            className="rounded-[16px] border border-[#EAEAEA] bg-white p-4 text-[#153E73] shadow-[0_4px_14px_rgba(21,62,115,0.06)]"
          >
            <h3 className="font-bold">企業訂購詢問</h3>
            <p className="mt-1 text-sm text-[#687386]">大宗採購與福委方案</p>
          </Link>
        </section>

        <Link
          href={APP_ROUTES.bakingMaterials}
          className="flex min-h-12 items-center justify-center rounded-[16px] border border-[#EAEAEA] bg-white text-sm font-bold text-[#153E73]"
        >
          進入烘焙材料目錄
        </Link>
      </div>
    </div>
  );
}
