"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
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
    fetch("/api/products")
      .then((r) => r.json())
      .then((p) => {
        if (p.products?.length) setProducts(p.products);
      })
      .catch(() => {});
  }, []);

  const newest = useMemo(() => getNewThisWeekProducts(products), [products]);
  const popular = useMemo(() => products.slice(0, 8), [products]);

  return (
    <div className="space-y-6 pb-2 pt-3">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-foreground">烘焙材料</h1>
        <p className="text-sm text-foreground-secondary">原料、器具、包裝一次購足</p>
        <HomeSearchBar placeholder="搜尋烘焙材料、品牌、SKU…" />
      </header>

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
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-caramel"
                )}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="overflow-hidden rounded-hero border border-border bg-peach-soft p-5">
        <p className="text-xs font-semibold text-caramel">商城活動</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">今日精選烘焙材料</h2>
        <p className="mt-1 text-sm text-foreground-secondary">依分類瀏覽、篩選品牌與價格</p>
        <Link
          href={APP_ROUTES.bakingMaterials}
          className="mt-3 inline-flex h-11 items-center rounded-button bg-primary px-4 text-sm font-bold text-white"
        >
          瀏覽烘焙材料
        </Link>
      </section>

      <NewProductsSection
        products={newest}
        href={`${APP_ROUTES.bakingMaterials}?sort=newest`}
        title="推薦新品"
      />
      <PopularProductsSection products={popular} href={APP_ROUTES.bakingMaterials} title="人氣商品" />

      <Link
        href={APP_ROUTES.bakingMaterials}
        className="flex min-h-12 items-center justify-center rounded-card border border-border bg-surface text-sm font-bold text-primary shadow-card"
      >
        進入烘焙材料目錄
      </Link>
    </div>
  );
}
