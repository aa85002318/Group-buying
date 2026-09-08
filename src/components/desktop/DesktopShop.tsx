"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DesktopProductCard } from "@/components/desktop/DesktopProductCard";
import { DesktopSidebarFilter } from "@/components/desktop/DesktopSidebarFilter";
import { productPath } from "@/lib/site-links";

type Product = {
  id: string;
  name: string;
  price?: number | null;
  sale_price?: number | null;
  image_url?: string | null;
  unit?: string | null;
  spec?: string | null;
  specification?: string | null;
  category?: string | null;
  brand?: string | null;
  stock?: number | null;
  is_new?: boolean;
  is_hot?: boolean;
  tags?: string[] | null;
};

export function DesktopShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<"default" | "hot" | "new">("default");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setProducts(d.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.brand) set.add(p.brand);
    }
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (brand !== "all") list = list.filter((p) => p.brand === brand);
    if (inStockOnly) list = list.filter((p) => Number(p.stock ?? 0) > 0);
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    if (min != null && !Number.isNaN(min)) {
      list = list.filter((p) => Number(p.sale_price ?? p.price ?? 0) >= min);
    }
    if (max != null && !Number.isNaN(max)) {
      list = list.filter((p) => Number(p.sale_price ?? p.price ?? 0) <= max);
    }
    if (sort === "new") {
      list = list.filter((p) => p.is_new || p.tags?.includes("new"));
    } else if (sort === "hot") {
      list = list.filter((p) => p.is_hot || p.tags?.includes("hot"));
    }
    return list;
  }, [products, category, brand, inStockOnly, priceMin, priceMax, sort]);

  return (
    <div className="bg-[var(--cream,#FFFDF9)] py-8">
      <DesktopContainer>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#153E73]">烘焙好物商城</h1>
            <p className="mt-1 text-sm text-[#7A5C4E]">
              {loading ? "載入中…" : `共 ${filtered.length} 件商品`}
            </p>
          </div>
          <Link href="/shop/search" className="text-sm font-semibold text-[#B56A45] hover:underline">
            進階搜尋
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <DesktopSidebarFilter
            categories={categories}
            brands={brands}
            category={category}
            brand={brand}
            inStockOnly={inStockOnly}
            sort={sort}
            priceMin={priceMin}
            priceMax={priceMax}
            onCategoryChange={setCategory}
            onBrandChange={setBrand}
            onInStockOnlyChange={setInStockOnly}
            onSortChange={setSort}
            onPriceMinChange={setPriceMin}
            onPriceMaxChange={setPriceMax}
          />

          <div className="grid grid-cols-3 gap-4 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((p) => (
              <DesktopProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={Number(p.sale_price ?? p.price ?? 0)}
                image_url={p.image_url}
                spec={p.spec || p.specification || p.unit}
                href={productPath(p.id)}
              />
            ))}
            {!loading && filtered.length === 0 ? (
              <p className="col-span-full py-16 text-center text-[#9A7B6C]">沒有符合條件的商品</p>
            ) : null}
          </div>
        </div>
      </DesktopContainer>
    </div>
  );
}
