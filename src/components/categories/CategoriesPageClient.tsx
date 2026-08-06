"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  CookingPot,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types/database";
import { PRODUCT_CATEGORIES, getEnabledProductCategories } from "@/data/product-categories";

type CategoryMode = "baking" | "group-buy";

type BakingCategory = ProductCategory & {
  banner_url?: string | null;
  shop_home_icon?: string | null;
  shop_home_bg_color?: string | null;
  custom_link?: string | null;
  product_count?: number | null;
};

type GroupBuyCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  description?: string | null;
  image_url?: string | null;
  icon_url?: string | null;
  background_color?: string | null;
  product_count?: number | null;
};

type CardItem = {
  id: string;
  name: string;
  href: string;
  description?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  backgroundColor?: string | null;
  productCount?: number | null;
};

const BAKING_ROOT_NAMES = new Set(["烘焙材料", "麵粉", "糖類", "奶油", "乳製品", "巧克力", "烘焙器具", "包裝材料"]);

const MODE_META: Record<
  CategoryMode,
  {
    title: string;
    hint: string;
    sectionTitle: string;
    ctaTitle: string;
    ctaDesc: string;
    allHref: string;
    icon: LucideIcon;
  }
> = {
  baking: {
    title: "烘焙材料",
    hint: "目前顯示：烘焙材料",
    sectionTitle: "烘焙材料分類",
    ctaTitle: "查看全部烘焙商品",
    ctaDesc: "探索所有烘焙材料與用品",
    allHref: APP_ROUTES.shop,
    icon: Wheat,
  },
  "group-buy": {
    title: "團購好物",
    hint: "目前顯示：團購好物",
    sectionTitle: "團購好物分類",
    ctaTitle: "查看全部團購好物",
    ctaDesc: "探索本週人氣團購與限定商品",
    allHref: "/group-buy",
    icon: ShoppingBag,
  },
};

const CARD_ICONS: LucideIcon[] = [Wheat, CookingPot, Package, Sparkles, ShoppingBag, ChevronRight];

function normalizeMode(value: string | null): CategoryMode {
  return value === "group-buy" ? "group-buy" : "baking";
}

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "");
}

function inferBakingCategories(categories: BakingCategory[]) {
  const bakingRootId = categories.find((category) => category.name === "烘焙材料")?.catalog_root_id ?? null;
  const filtered = categories.filter((category) => {
    if (category.is_active === false) return false;
    if (category.catalog_root_id && bakingRootId) return category.catalog_root_id === bakingRootId;
    if (category.catalog_root_id) return true;
    return BAKING_ROOT_NAMES.has(category.name);
  });
  return filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "zh-TW"));
}

function fallbackGroupBuyCategories(): GroupBuyCategory[] {
  const root = getEnabledProductCategories(PRODUCT_CATEGORIES).find((category) => category.id === "group-buy");
  return (root?.children ?? []).map((child) => ({
    id: child.id,
    name: child.name,
    slug: child.slug,
    href: child.href,
    description: null,
  }));
}

function toBakingCard(category: BakingCategory): CardItem {
  return {
    id: category.id,
    name: category.name,
    href: category.custom_link?.trim() || `/products?category=${encodeURIComponent(category.id)}`,
    description: category.description ?? null,
    imageUrl: category.shop_home_icon ?? category.icon_url ?? category.banner_url ?? undefined,
    iconUrl: category.icon_url ?? undefined,
    backgroundColor: category.shop_home_bg_color ?? undefined,
    productCount: category.product_count ?? null,
  };
}

function toGroupBuyCard(category: GroupBuyCategory): CardItem {
  return {
    id: category.id,
    name: category.name,
    href: category.href,
    description: category.description ?? null,
    imageUrl: category.image_url ?? undefined,
    iconUrl: category.icon_url ?? undefined,
    backgroundColor: category.background_color ?? undefined,
    productCount: category.product_count ?? null,
  };
}

function filterCards(cards: CardItem[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return cards;
  return cards.filter((card) =>
    [card.name, card.description ?? ""].join(" ").toLowerCase().includes(needle)
  );
}

function CategorySkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-3 min-[360px]:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 sm:gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[116px] animate-pulse rounded-2xl border border-[#E9EDF2] bg-white p-4"
        >
          <div className="mx-auto h-[60px] w-[60px] rounded-full bg-[#F3F5F8] sm:h-20 sm:w-20" />
          <div className="mx-auto mt-3 h-4 w-16 rounded bg-[#F3F5F8]" />
        </div>
      ))}
    </div>
  );
}

function CategoryCard({ item, index }: { item: CardItem; index: number }) {
  const FallbackIcon = CARD_ICONS[index % CARD_ICONS.length] ?? Package;
  const iconBg = item.backgroundColor || "#F7F4EC";

  return (
    <Link
      href={item.href}
      className="group flex min-h-[116px] flex-col items-center rounded-2xl border border-[#E9EDF2] bg-white px-3 py-4 text-center transition duration-200 hover:-translate-y-[3px] hover:border-[#FFE149] hover:shadow-[0_8px_22px_rgba(21,62,115,0.10)] active:scale-[0.98]"
    >
      <div
        className="relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full sm:h-28 sm:w-28"
        style={{ backgroundColor: iconBg }}
      >
        {item.imageUrl || item.iconUrl ? (
          <Image
            src={item.imageUrl || item.iconUrl || ""}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <FallbackIcon className="h-7 w-7 text-[#153E73] sm:h-10 sm:w-10" aria-hidden />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-center text-[13px] font-bold text-[#153E73] sm:text-[17px]">
        {item.name}
      </h3>
      {item.description ? (
        <p className="mt-1 hidden line-clamp-2 text-center text-xs text-[#687386] sm:block">
          {item.description}
        </p>
      ) : null}
      {typeof item.productCount === "number" ? (
        <p className="mt-1 text-[11px] text-[#687386]">{item.productCount} 件商品</p>
      ) : null}
    </Link>
  );
}

export function CategoriesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<CategoryMode>(() => normalizeMode(searchParams.get("type")));
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [bakingCategories, setBakingCategories] = useState<BakingCategory[]>([]);
  const [groupBuyCategories, setGroupBuyCategories] = useState<GroupBuyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(normalizeMode(searchParams.get("type")));
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bakingRes, groupBuyRes] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/group-buy/campaigns?status=all&pageSize=200", { cache: "no-store" }),
      ]);

      const [bakingJson, groupBuyJson] = await Promise.all([
        bakingRes.json().catch(() => ({})),
        groupBuyRes.json().catch(() => ({})),
      ]);

      if (!bakingRes.ok) throw new Error(bakingJson.error ?? "商品分類載入失敗");
      if (!groupBuyRes.ok) throw new Error(groupBuyJson.error ?? "團購分類載入失敗");

      const bakingRows = inferBakingCategories((bakingJson.categories ?? []) as BakingCategory[]);
      const groupRowsRaw = Array.isArray(groupBuyJson.categories)
        ? (groupBuyJson.categories as string[]).map((name) => ({
            id: `gb-${makeSlug(name)}`,
            name,
            slug: makeSlug(name),
            href: `/group-buy?category=${encodeURIComponent(name)}`,
          }))
        : [];

      setBakingCategories(bakingRows);
      setGroupBuyCategories(groupRowsRaw.length ? groupRowsRaw : fallbackGroupBuyCategories());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "商品分類載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateUrl = useCallback(
    (nextMode: CategoryMode, nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextMode === "baking") params.delete("type");
      else params.set("type", nextMode);
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      else params.delete("q");
      const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      const current = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      if (next !== current) {
        router.push(next, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  const bakingCards = useMemo(() => bakingCategories.map(toBakingCard), [bakingCategories]);
  const groupBuyCards = useMemo(() => groupBuyCategories.map(toGroupBuyCard), [groupBuyCategories]);
  const cards = useMemo(() => {
    const source = mode === "baking" ? bakingCards : groupBuyCards;
    return filterCards(source, query);
  }, [bakingCards, groupBuyCards, mode, query]);

  const meta = MODE_META[mode];
  const Icon = meta.icon;

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#FFFEFA]">
      <main className="mx-auto flex-1 px-5 pb-[calc(104px+env(safe-area-inset-bottom))] pt-6 md:max-w-[1200px] md:px-8 md:pb-8">
        <section className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <div>
            <h1 className="text-[26px] font-bold text-[#153E73] md:text-[34px]">商品分類</h1>
            <p className="mt-1.5 text-sm text-[#687386] md:text-base">烘焙材料與人氣團購，一次找到</p>
          </div>

          <label className="flex h-[52px] w-full items-center rounded-full border border-[#E6E9EF] bg-white px-4 focus-within:ring-4 focus-within:ring-[rgba(121,199,232,0.4)] md:w-[360px]">
            <Search className="h-4 w-4 shrink-0 text-[#687386]" aria-hidden />
            <span className="sr-only">搜尋分類</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                updateUrl(mode, nextQuery);
              }}
              placeholder="搜尋分類"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#153E73] outline-none placeholder:text-[#687386]"
            />
            {query ? (
              <button
                type="button"
                aria-label="清除搜尋"
                onClick={() => {
                  setQuery("");
                  updateUrl(mode, "");
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#687386]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </label>
        </section>

        <section className="mx-auto mt-6 max-w-[760px]">
          <div className="grid h-16 grid-cols-2 rounded-2xl border border-[#E6E9EF] bg-white p-1.5 shadow-[0_5px_18px_rgba(21,62,115,0.06)] md:h-[76px]">
            {(["baking", "group-buy"] as const).map((item) => {
              const active = mode === item;
              const ItemIcon = MODE_META[item].icon;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item);
                    updateUrl(item, query);
                  }}
                  className={cn(
                    "flex min-h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#153E73] transition duration-200 hover:bg-[#FFF5CC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(121,199,232,0.4)] md:text-base",
                    active && "bg-[#FFE149] font-bold"
                  )}
                >
                  <ItemIcon className="h-5 w-5 text-[#153E73]" aria-hidden />
                  <span className="truncate">{MODE_META[item].title}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 hidden text-center text-[13px] text-[#687386] md:block">
            目前顯示：<span className="font-semibold text-[#153E73]">{meta.title}</span>
          </p>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-bold text-[#153E73] md:text-2xl">{meta.sectionTitle}</h2>
            <Link
              href={meta.allHref}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-[#153E73] transition hover:bg-[#FFF5CC] hover:underline"
            >
              查看全部
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {error ? (
            <div className="rounded-2xl border border-[#E6E9EF] bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-bold text-[#153E73]">商品分類載入失敗</h3>
              <p className="mt-2 text-sm text-[#687386]">請稍後再試一次。</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-[#153E73] px-5 text-sm font-semibold text-[#153E73]"
              >
                重新載入
              </button>
            </div>
          ) : loading ? (
            <CategorySkeletonGrid />
          ) : cards.length === 0 ? (
            <div className="rounded-2xl border border-[#E6E9EF] bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-bold text-[#153E73]">找不到符合的分類</h3>
              <p className="mt-2 text-sm text-[#687386]">換個關鍵字試試，或清除搜尋條件。</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  updateUrl(mode, "");
                }}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-[#153E73] px-5 text-sm font-semibold text-[#153E73]"
              >
                清除搜尋
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 min-[360px]:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 sm:gap-4">
              {cards.map((item, index) => (
                <CategoryCard key={`${mode}-${item.id}`} item={item} index={index} />
              ))}
            </div>
          )}
        </section>

        <Link
          href={meta.allHref}
          className="mt-8 flex min-h-[80px] w-full items-center gap-3 rounded-2xl border border-transparent bg-[#FFF5CC] px-4 py-4 transition hover:border-[#FFE149] md:min-h-24 md:px-6"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#153E73] md:h-14 md:w-14">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-[#153E73] md:text-lg">{meta.ctaTitle}</p>
            <p className="mt-1 text-xs text-[#687386] md:text-sm">{meta.ctaDesc}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#153E73]" aria-hidden />
        </Link>
      </main>
    </div>
  );
}
