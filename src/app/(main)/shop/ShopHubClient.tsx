"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HomeSearchBar } from "@/components/consumer/HomeSearchBar";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductScrollSection } from "@/components/home/ProductScrollSection";
import { getNewThisWeekProducts } from "@/lib/home";
import { mockCategories, mockProducts } from "@/lib/mock-data";
import type { Product, ProductCategory } from "@/lib/types/database";

const QUICK_CATS = [
  { label: "烘焙原料", href: "/products?search=粉" },
  { label: "器具", href: "/products?search=模" },
  { label: "包裝", href: "/products?search=包裝" },
  { label: "冷凍冷藏", href: "/products?search=奶油" },
  { label: "巧克力", href: "/products?search=巧克力" },
  { label: "乳製品", href: "/products?search=乳" },
];

export function ShopHubClient() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<ProductCategory[]>(mockCategories);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([p, c]) => {
        if (p.products?.length) setProducts(p.products);
        if (c.categories?.length) setCategories(c.categories);
      })
      .catch(() => {});
  }, []);

  const newest = useMemo(() => getNewThisWeekProducts(products), [products]);
  const popular = useMemo(() => products.slice(0, 8), [products]);

  return (
    <div className="space-y-8 page-enter">
      <header className="space-y-3">
        <p className="text-xs font-bold text-primary">烘焙材料商城</p>
        <h1 className="text-2xl font-black text-foreground">CHIMEIDIY 烘焙材料</h1>
        <p className="text-sm text-foreground-secondary">
          保留完整商品列表、購物車與結帳流程 — 本頁為入口整理。
        </p>
        <HomeSearchBar placeholder="搜尋烘焙材料、品牌、SKU…" />
      </header>

      <CategoryGrid categories={categories} />

      <section>
        <SectionHeader title="精選分類" href="/categories" />
        <div className="flex flex-wrap gap-2">
          {QUICK_CATS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-bold text-foreground hover:bg-surface-soft"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <ProductScrollSection
        title="今日新品"
        products={newest}
        seeMoreHref="/products?sort=newest"
        variant="new"
        badge="NEW"
        badgeTone="new"
      />

      <ProductScrollSection
        title="人氣商品"
        products={popular}
        seeMoreHref="/products"
        variant="hot"
        badge="HOT"
        badgeTone="hot"
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/products" className="btn-brand">
          瀏覽全部商品
        </Link>
        <Link href="/products" className="btn-secondary">
          品牌／分類逛逛
        </Link>
        <Link href="/cart" className="btn-ghost">
          前往購物車
        </Link>
      </div>
    </div>
  );
}
