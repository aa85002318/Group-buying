"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShopHeroBanner } from "@/components/shop/ShopHeroBanner";
import { ShopSearchBar } from "@/components/shop/ShopSearchBar";
import {
  NewProductsSection,
  PopularProductsSection,
} from "@/components/home/NewProductsSection";
import { getNewThisWeekProducts } from "@/lib/home";
import { mockProducts } from "@/lib/mock-data";
import { APP_ROUTES } from "@/lib/site-links";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const CHIPS = [
  { label: "全部", href: APP_ROUTES.bakingMaterials },
  { label: "麵粉", href: "/baking-materials/flour" },
  { label: "器具", href: "/baking-materials/tools" },
  { label: "包裝", href: "/baking-materials/packaging" },
  { label: "冷凍冷藏", href: "/baking-materials/frozen-goods" },
  { label: "巧克力", href: "/baking-materials/chocolate" },
  { label: "乳製品", href: "/baking-materials/dairy" },
];

export function ShopHubClient() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [active, setActive] = useState(CHIPS[0].label);

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
    <>
      <ShopHeroBanner />
      <ShopSearchBar />

      <div className="shop-hub-body mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-2 md:px-6">
        <section aria-label="商品分類">
          <div className="h-scroll">
            <div className="flex w-max gap-2">
              {CHIPS.map((c) => {
                const selected = active === c.label;
                return (
                  <Link
                    key={c.label}
                    href={c.href}
                    onClick={() => setActive(c.label)}
                    className={cn(
                      "inline-flex h-10 min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition",
                      selected
                        ? "border-[#153E73] bg-[#153E73] text-white"
                        : "border-[#EAEAEA] bg-white text-[#153E73]"
                    )}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#EAEAEA] bg-[#FFFEFA] p-5">
          <p className="text-xs font-semibold text-[#F0645A]">商城活動</p>
          <h2 className="mt-1 text-lg font-bold text-[#153E73]">今日精選烘焙材料</h2>
          <p className="mt-1 text-sm text-[#687386]">依分類瀏覽、篩選品牌與價格</p>
          <Link
            href={APP_ROUTES.bakingMaterials}
            className="mt-3 inline-flex h-11 items-center rounded-full bg-[#153E73] px-4 text-sm font-bold text-white"
          >
            瀏覽烘焙材料
          </Link>
        </section>

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
    </>
  );
}
