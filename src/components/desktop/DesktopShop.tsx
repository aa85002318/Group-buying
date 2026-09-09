"use client";

import { useEffect, useMemo, useState } from "react";
import { DesktopProductCard } from "@/components/desktop/DesktopProductCard";
import { DesktopInnerPageLayout } from "@/components/desktop/layout/DesktopInnerPageLayout";
import { DesktopPagination } from "@/components/desktop/layout/DesktopPagination";
import {
  INNER_PAGE_HEROES,
  SHOP_FILTERS,
  SHOP_SIDEBAR_ITEMS,
} from "@/lib/desktop/inner-page-config";
import { APP_ROUTES, productPath } from "@/lib/site-links";

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

const PAGE_SIZE = 20;

export function DesktopShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState<Record<string, string[]>>({ tag: ["all"] });
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") {
      list = list.filter(
        (p) => p.category === category || (p.name || "").includes(category)
      );
    }
    if ((filters.stock ?? []).includes("in_stock")) {
      list = list.filter((p) => Number(p.stock ?? 0) > 0);
    }
    const tag = (filters.tag ?? ["all"])[0];
    if (tag === "new") list = list.filter((p) => p.is_new || p.tags?.includes("new"));
    if (tag === "hot") list = list.filter((p) => p.is_hot || p.tags?.includes("hot"));
    if (sort === "price_asc") {
      list.sort(
        (a, b) => Number(a.sale_price ?? a.price ?? 0) - Number(b.sale_price ?? b.price ?? 0)
      );
    } else if (sort === "price_desc") {
      list.sort(
        (a, b) => Number(b.sale_price ?? b.price ?? 0) - Number(a.sale_price ?? a.price ?? 0)
      );
    }
    return list;
  }, [products, category, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [category, filters, sort]);

  const dynamicNav = useMemo(() => {
    const cats = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean) as string[])
    ).slice(0, 8);
    if (!cats.length) return SHOP_SIDEBAR_ITEMS;
    return [
      { key: "all", label: "全部商品" },
      ...cats.map((c) => ({ key: c, label: c })),
    ];
  }, [products]);

  return (
    <DesktopInnerPageLayout
      hero={INNER_PAGE_HEROES.shop}
      breadcrumb={[
        { label: "首頁", href: APP_ROUTES.home },
        { label: "商城" },
      ]}
      sidebar={{
        title: "商品分類",
        items: dynamicNav,
        activeKey: category,
        onItemSelect: setCategory,
        filters: SHOP_FILTERS,
        selectedFilters: filters,
        onFilterChange: (key, values) =>
          setFilters((prev) => ({ ...prev, [key]: values })),
        onClearFilters: () => setFilters({ tag: ["all"] }),
      }}
      toolbar={{
        title: "全部商品",
        description: "精選烘焙材料、器具與包裝，一次購足。",
        totalLabel: loading ? "載入中…" : `共 ${filtered.length} 件商品`,
        sortValue: sort,
        sortOptions: [
          { value: "default", label: "預設排序" },
          { value: "price_asc", label: "價格由低到高" },
          { value: "price_desc", label: "價格由高到低" },
        ],
        onSortChange: setSort,
      }}
      footerSlot={
        <DesktopPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      }
    >
      <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
        {pageItems.map((p) => (
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
      </div>
      {!loading && pageItems.length === 0 ? (
        <p className="py-16 text-center text-[#687386]">沒有符合條件的商品</p>
      ) : null}
    </DesktopInnerPageLayout>
  );
}
