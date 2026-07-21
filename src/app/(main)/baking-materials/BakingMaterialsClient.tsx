"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard, type ProductBadge } from "@/components/products/ProductCard";
import type {
  BakingBrand,
  BakingCategory,
  BakingCategoryTreeNode,
  BakingListProduct,
  BakingPageSize,
  BakingProductFilters,
  BakingSortOption,
} from "@/lib/baking-materials/types";
import { cn } from "@/lib/utils";

type BakingMaterialsClientProps = {
  categorySlug?: string;
};

type CatalogMeta = {
  categories: BakingCategory[];
  tree: BakingCategoryTreeNode[];
  brands: BakingBrand[];
};

const SORT_OPTIONS: { value: BakingSortOption; label: string }[] = [
  { value: "popular", label: "熱門優先" },
  { value: "newest", label: "最新上架" },
  { value: "price_asc", label: "價格由低到高" },
  { value: "price_desc", label: "價格由高到低" },
  { value: "name", label: "名稱 A–Z" },
];

const PAGE_SIZE_OPTIONS: BakingPageSize[] = [24, 48, 72];

function parseFiltersFromParams(
  sp: URLSearchParams,
  categorySlug?: string
): BakingProductFilters {
  const pageSizeRaw = Number(sp.get("pageSize"));
  const pageSize: BakingPageSize | undefined =
    pageSizeRaw === 48 || pageSizeRaw === 72 ? pageSizeRaw : pageSizeRaw === 24 ? 24 : undefined;

  const sort = sp.get("sort") as BakingSortOption | null;

  return {
    q: sp.get("q")?.trim() || undefined,
    categorySlug,
    brand: sp.get("brand")?.trim() || undefined,
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    inStock: sp.get("inStock") === "1" || sp.get("inStock") === "true",
    sort:
      sort === "popular" ||
      sort === "newest" ||
      sort === "price_asc" ||
      sort === "price_desc" ||
      sort === "name"
        ? sort
        : "popular",
    page: Math.max(1, Number(sp.get("page") ?? 1) || 1),
    pageSize: pageSize ?? 24,
  };
}

function buildSearchParams(filters: BakingProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.inStock) params.set("inStock", "1");
  if (filters.sort && filters.sort !== "popular") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== 24) params.set("pageSize", String(filters.pageSize));
  return params;
}

function productBadge(product: BakingListProduct): ProductBadge | undefined {
  if (product.stock_status === "out") return "soldout";
  if (product.badges.includes("新品")) return "new";
  if (product.badges.includes("熱門")) return "hot";
  if (product.stock_status === "in_stock") return "instock";
  return undefined;
}

function CategoryTreeItem({
  node,
  activeSlug,
  depth = 0,
}: {
  node: BakingCategoryTreeNode;
  activeSlug?: string;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0 || node.slug === activeSlug);
  const hasChildren = node.children.length > 0;
  const isActive = node.slug === activeSlug;

  return (
    <li>
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 12 }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#8C644A] hover:bg-[#FFF9EA]"
            aria-label={open ? "收合分類" : "展開分類"}
          >
            <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
          </button>
        ) : (
          <span className="inline-block h-7 w-7 shrink-0" />
        )}
        <Link
          href={`/baking-materials/${node.slug}`}
          className={cn(
            "min-w-0 flex-1 rounded-md px-2 py-1.5 text-sm transition",
            isActive
              ? "bg-[#FFF9EA] font-semibold text-[#FF5A5F]"
              : "text-[#6B3F24] hover:bg-[#FFF9EA]"
          )}
        >
          {node.name}
        </Link>
      </div>
      {hasChildren && open && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <CategoryTreeItem key={child.id} node={child} activeSlug={activeSlug} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function BakingMaterialsClient({ categorySlug }: BakingMaterialsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobileRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [meta, setMeta] = useState<CatalogMeta>({ categories: [], tree: [], brands: [] });
  const [products, setProducts] = useState<BakingListProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams, categorySlug),
    [searchParams, categorySlug]
  );

  const activeCategory = useMemo(
    () => meta.categories.find((c) => c.slug === categorySlug) ?? null,
    [meta.categories, categorySlug]
  );

  const level1Categories = useMemo(
    () =>
      meta.categories
        .filter((c) => c.level === 1)
        .sort((a, c) => a.sort_order - c.sort_order)
        .slice(0, 8),
    [meta.categories]
  );

  const pushFilters = useCallback(
    (next: Partial<BakingProductFilters>, options?: { append?: boolean }) => {
      const merged: BakingProductFilters = {
        ...filters,
        ...next,
        categorySlug,
      };
      if (!options?.append) {
        merged.page = next.page ?? 1;
      }
      const params = buildSearchParams(merged);
      const base = categorySlug ? `/baking-materials/${categorySlug}` : "/baking-materials";
      const query = params.toString();
      router.push(query ? `${base}?${query}` : base, { scroll: false });
    },
    [filters, categorySlug, router]
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      isMobileRef.current = mq.matches;
      setIsMobile(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setSearchInput(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/baking-materials/categories").then((r) => r.json()),
      fetch("/api/baking-materials/brands").then((r) => r.json()),
    ])
      .then(([catData, brandData]) => {
        if (cancelled) return;
        setMeta({
          categories: catData.categories ?? [],
          tree: catData.tree ?? [],
          brands: brandData.brands ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setMeta({ categories: [], tree: [], brands: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const append = isMobileRef.current && (filters.page ?? 1) > 1;

    if (append) setLoadingMore(true);
    else setLoading(true);

    const params = buildSearchParams(filters);
    if (categorySlug) params.set("categorySlug", categorySlug);

    fetch(`/api/baking-materials/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const nextProducts = (data.products ?? []) as BakingListProduct[];
        setProducts((prev) => (append ? [...prev, ...nextProducts] : nextProducts));
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        if (!append) {
          setProducts([]);
          setTotal(0);
          setTotalPages(0);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, categorySlug]);

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    pushFilters({ q: searchInput.trim() || undefined, page: 1 });
  };

  const pageNumbers = useMemo(() => {
    const current = filters.page ?? 1;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [filters.page, totalPages]);

  const sidebarFilters = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[#6B3F24]">分類</h3>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/baking-materials"
              className={cn(
                "block rounded-md px-2 py-1.5 text-sm transition",
                !categorySlug
                  ? "bg-[#FFF9EA] font-semibold text-[#FF5A5F]"
                  : "text-[#6B3F24] hover:bg-[#FFF9EA]"
              )}
            >
              全部商品
            </Link>
          </li>
          {meta.tree.map((node) => (
            <CategoryTreeItem key={node.id} node={node} activeSlug={categorySlug} />
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[#6B3F24]">品牌</h3>
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => pushFilters({ brand: undefined, page: 1 })}
            className={cn(
              "block w-full rounded-md px-2 py-1.5 text-left text-sm transition",
              !filters.brand ? "bg-[#FFF9EA] font-semibold text-[#FF5A5F]": "text-[#6B3F24] hover:bg-[#FFF9EA]"
            )}
          >
            全部品牌
          </button>
          {meta.brands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => pushFilters({ brand: brand.slug, page: 1 })}
              className={cn(
                "block w-full rounded-md px-2 py-1.5 text-left text-sm transition",
                filters.brand === brand.slug
                  ? "bg-[#FFF9EA] font-semibold text-[#FF5A5F]"
                  : "text-[#6B3F24] hover:bg-[#FFF9EA]"
              )}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[#6B3F24]">價格</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="最低"
            defaultValue={filters.minPrice ?? ""}
            key={`min-${filters.minPrice ?? "x"}`}
            onBlur={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              pushFilters({ minPrice: val, page: 1 });
            }}
            className="input-field h-10 min-h-10 flex-1 text-sm"
          />
          <span className="text-[#8C644A]">–</span>
          <input
            type="number"
            min={0}
            placeholder="最高"
            defaultValue={filters.maxPrice ?? ""}
            key={`max-${filters.maxPrice ?? "x"}`}
            onBlur={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              pushFilters({ maxPrice: val, page: 1 });
            }}
            className="input-field h-10 min-h-10 flex-1 text-sm"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#6B3F24]">
        <input
          type="checkbox"
          checked={Boolean(filters.inStock)}
          onChange={(e) => pushFilters({ inStock: e.target.checked || undefined, page: 1 })}
          className="h-4 w-4 rounded border-[#F2D8BF] text-[#FF5A5F]"
        />
        僅顯示有現貨
      </label>
    </div>
  );

  return (
    <div className="baking-catalog-root min-h-full bg-[#FFF9EA] overflow-x-clip">
      <div className="baking-catalog-inner mx-auto max-w-[1280px] bg-white px-3 py-4 min-[375px]:px-4 md:px-6 md:py-6">
        <nav aria-label="麵包屑" className="mb-3 text-xs text-[#8C644A] md:text-sm">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#FF5A5F]">
                首頁
              </Link>
            </li>
            <li aria-hidden>&gt;</li>
            <li>
              {categorySlug ? (
                <Link href="/baking-materials" className="hover:text-[#FF5A5F]">
                  烘焙材料
                </Link>
              ) : (
                <span className="font-medium text-[#6B3F24]">烘焙材料</span>
              )}
            </li>
            {activeCategory && (
              <>
                <li aria-hidden>&gt;</li>
                <li className="font-medium text-[#6B3F24]">{activeCategory.name}</li>
              </>
            )}
          </ol>
        </nav>

        <header className="mb-4 space-y-3">
          <h1 className="text-xl font-bold text-[#6B3F24] md:text-2xl">
            {activeCategory?.name ?? "烘焙材料"}
          </h1>
          <form onSubmit={onSearchSubmit} role="search">
            <div className="relative flex h-[48px] items-center rounded-[14px] border border-[#F2D8BF] bg-white">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#8C644A]" aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜尋商品、SKU、品牌…"
                className="h-full w-full rounded-[14px] bg-transparent py-2 pl-10 pr-20 text-sm text-[#6B3F24] outline-none placeholder:text-[#8C644A]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-[10px] bg-[#FF5A5F] px-3 text-sm font-semibold text-white"
              >
                搜尋
              </button>
            </div>
          </form>
        </header>

        {level1Categories.length > 0 && (
          <section aria-label="熱門分類" className="mb-4">
            <div className="baking-catalog-chips flex gap-2 overflow-x-auto pb-1">
              <Link
                href="/baking-materials"
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition",
                  !categorySlug
                    ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
                    : "border-[#F2D8BF] bg-white text-[#6B3F24]"
                )}
              >
                全部
              </Link>
              {level1Categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/baking-materials/${cat.slug}`}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition",
                    categorySlug === cat.slug
                      ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
                      : "border-[#F2D8BF] bg-white text-[#6B3F24]"
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-6 md:items-start">
          <aside className="hidden w-[220px] shrink-0 md:block lg:w-[260px]">{sidebarFilters}</aside>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[#8C644A]">
                {loading && products.length === 0 ? "載入中…" : `共 ${total} 件商品`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1 rounded-full border border-[#F2D8BF] px-3 text-sm font-medium text-[#6B3F24] md:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  全部篩選
                </button>
                <select
                  value={filters.sort ?? "popular"}
                  onChange={(e) =>
                    pushFilters({ sort: e.target.value as BakingSortOption, page: 1 })
                  }
                  className="input-field h-10 min-h-10 w-auto min-w-[8rem] text-sm"
                  aria-label="排序"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.pageSize ?? 24}
                  onChange={(e) =>
                    pushFilters({ pageSize: Number(e.target.value) as BakingPageSize, page: 1 })
                  }
                  className="input-field hidden h-10 min-h-10 w-auto min-w-[5rem] text-sm md:block"
                  aria-label="每頁筆數"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} 件
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!loading && products.length === 0 ? (
              <div className="rounded-[20px] border border-[#F2D8BF] bg-[#FFF9EA] px-6 py-12 text-center">
                <p className="font-semibold text-[#6B3F24]">找不到符合條件的商品</p>
                <p className="mt-1 text-sm text-[#8C644A]">試試調整篩選條件或搜尋其他關鍵字。</p>
                <Link
                  href="/baking-materials"
                  className="mt-4 inline-flex h-10 items-center rounded-button bg-[#FF5A5F] px-4 text-sm font-bold text-white"
                >
                  查看全部烘焙材料
                </Link>
              </div>
            ) : (
              <div className="baking-catalog-grid grid grid-cols-2 gap-[10px] min-[375px]:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map((product) => {
                  const displayPrice = product.sale_price ?? product.price;
                  const original =
                    product.sale_price != null && product.sale_price < product.price
                      ? product.price
                      : null;
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={displayPrice}
                      original_price={original}
                      image_url={product.cover_image || null}
                      brandOrSpec={
                        [product.brand_name, product.primary_variant_name].filter(Boolean).join(" · ") ||
                        product.sku ||
                        null
                      }
                      badge={productBadge(product)}
                      href={`/products/${product.id}`}
                    />
                  );
                })}
              </div>
            )}

            {isMobile && products.length > 0 && (filters.page ?? 1) < totalPages && (
              <div className="mt-4 flex justify-center md:hidden">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => pushFilters({ page: (filters.page ?? 1) + 1 }, { append: true })}
                  className="inline-flex h-11 min-w-[10rem] items-center justify-center rounded-button border border-[#F2D8BF] bg-white px-4 text-sm font-semibold text-[#6B3F24] disabled:opacity-60"
                >
                  {loadingMore ? "載入中…" : "載入更多"}
                </button>
              </div>
            )}

            {!isMobile && totalPages > 1 && (
              <nav aria-label="分頁" className="mt-6 hidden items-center justify-center gap-1 md:flex">
                <button
                  type="button"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => pushFilters({ page: (filters.page ?? 1) - 1 })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#F2D8BF] text-[#6B3F24] disabled:opacity-40"
                  aria-label="上一頁"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => pushFilters({ page: pageNum })}
                    className={cn(
                      "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm font-semibold",
                      pageNum === (filters.page ?? 1)
                        ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
                        : "border-[#F2D8BF] text-[#6B3F24] hover:bg-[#FFF9EA]"
                    )}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => pushFilters({ page: (filters.page ?? 1) + 1 })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#F2D8BF] text-[#6B3F24] disabled:opacity-40"
                  aria-label="下一頁"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="關閉篩選"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[20px] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#6B3F24]">全部篩選</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF9EA] text-[#6B3F24]"
                aria-label="關閉"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarFilters}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-button bg-[#FF5A5F] text-sm font-bold text-white"
            >
              套用篩選
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
