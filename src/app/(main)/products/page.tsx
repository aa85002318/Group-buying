"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductSortBar } from "@/components/products/ProductSortBar";
import { mockCategories, mockProducts } from "@/lib/mock-data";
import type { Product, ProductCategory } from "@/lib/types/database";

type SortOption = "newest" | "price_asc" | "price_desc";

function sortProducts(products: Product[], sort: SortOption): Product[] {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    default:
      return list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const sort = (searchParams.get("sort") as SortOption) || "newest";

  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<ProductCategory[]>(mockCategories);
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    return params.toString();
  }, [search, category, tag]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.categories)) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = queryString ? `/api/products?${queryString}` : "/api/products";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products)) setProducts(data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [queryString]);

  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);

  const pageTitle = useMemo(() => {
    if (search) return `搜尋「${search}」`;
    if (tag) return tag;
    if (category) {
      const cat = categories.find((c) => c.id === category);
      return cat?.name ?? "商品分類";
    }
    return "全部商品";
  }, [search, category, tag, categories]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/" className="text-sm text-primary hover:underline md:hidden">
            ← 首頁
          </Link>
          <h1 className="text-xl font-bold text-coffee">{pageTitle}</h1>
        </div>
        {!loading && (
          <span className="shrink-0 text-sm text-muted-foreground">共 {sortedProducts.length} 件</span>
        )}
      </div>

      {!tag && <ProductSortBar />}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="space-y-3 py-16 text-center">
          <p className="text-muted-foreground">目前沒有找到相關商品</p>
          <Link href="/products" className="text-sm text-primary hover:underline">
            查看全部商品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              original_price={product.original_price}
              image_url={product.image_url}
              groupBuyLabel={
                tag === "限時優惠" ||
                (product.original_price != null && product.original_price > product.price)
                  ? "限時優惠"
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-muted-foreground">載入中...</p>}>
      <ProductsContent />
    </Suspense>
  );
}
