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
  category_id?: string | null;
  product_categories?: { name?: string | null; slug?: string | null } | null;
  brand?: string | null;
  stock?: number | null;
  is_new?: boolean;
  is_hot?: boolean;
  tags?: string[] | null;
};

const PAGE_SIZE = 20;

type ShopCategory = {
  id: string;
  name: string;
  slug?: string | null;
  sort_order?: number | null;
  parent_id?: string | null;
};

function sortCats(a: ShopCategory, b: ShopCategory) {
  const byOrder = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
  if (byOrder !== 0) return byOrder;
  return a.name.localeCompare(b.name, "zh-Hant");
}

/** 選中大分類時一併納入其下所有小分類 id，篩選才不會漏商品。 */
function collectDescendantIds(
  rootId: string,
  byParent: Map<string, ShopCategory[]>
): Set<string> {
  const ids = new Set<string>([rootId]);
  const walk = (pid: string) => {
    for (const child of byParent.get(pid) ?? []) {
      ids.add(child.id);
      walk(child.id);
    }
  };
  walk(rootId);
  return ids;
}

export function DesktopShop() {
  const [products, setProducts] = useState<Product[]>([]);
  // 側邊分類沿用後台「商品分類」的設定與排序；大分類常駐、小分類手風琴展開。
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState<Record<string, string[]>>({ tag: ["all"] });
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCategories((d.categories ?? []) as ShopCategory[]);
      })
      .catch(() => {});
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

  const childrenByParent = useMemo(() => {
    const map = new Map<string, ShopCategory[]>();
    for (const cat of categories) {
      const pid = cat.parent_id;
      if (!pid) continue;
      const list = map.get(pid) ?? [];
      list.push(cat);
      map.set(pid, list);
    }
    for (const list of map.values()) list.sort(sortCats);
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") {
      const picked = categories.find((c) => c.id === category);
      const name = picked?.name ?? category;
      const slug = picked?.slug ?? null;
      const matchIds = picked
        ? collectDescendantIds(picked.id, childrenByParent)
        : new Set<string>([category]);
      list = list.filter(
        (p) =>
          (p.category_id && matchIds.has(p.category_id)) ||
          (slug && p.product_categories?.slug === slug) ||
          p.product_categories?.name === name ||
          p.category === name ||
          (!picked && (p.name || "").includes(category))
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
  }, [products, categories, childrenByParent, category, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [category, filters, sort]);

  const dynamicNav = useMemo(() => {
    if (categories.length) {
      const roots = categories.filter((c) => !c.parent_id).sort(sortCats);
      return [
        { key: "all", label: "全部商品" },
        ...roots.map((c) => {
          // 側欄只展一層：大分類下的直接小分類；更深層併入該小分類篩選範圍即可
          const directKids = childrenByParent.get(c.id) ?? [];
          return {
            key: c.id,
            label: c.name,
            children: directKids.map((child) => ({
              key: child.id,
              label: child.name,
            })),
          };
        }),
      ];
    }
    const cats = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean) as string[])
    ).slice(0, 8);
    if (!cats.length) return SHOP_SIDEBAR_ITEMS;
    return [
      { key: "all", label: "全部商品" },
      ...cats.map((c) => ({ key: c, label: c })),
    ];
  }, [categories, childrenByParent, products]);

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
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
