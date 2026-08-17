"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grid2X2 } from "lucide-react";
import {
  buildShopHomeCategories,
  DEFAULT_SHOP_CATEGORIES,
  type ShopCategoryItem,
} from "@/lib/shop/categories";
import { cn } from "@/lib/utils";

function CategoryIcon({
  category,
  index,
}: {
  category: ShopCategoryItem;
  index: number;
}) {
  const [failed, setFailed] = useState(false);

  if (category.icon === "grid" || !category.image || failed) {
    if (category.icon === "grid") {
      return (
        <Grid2X2
          className="h-8 w-8 text-[#153E73] md:h-9 md:w-9 lg:h-10 lg:w-10"
          strokeWidth={1.8}
          aria-hidden
        />
      );
    }
    return (
      <span
        className="h-[40%] w-[40%] rounded-md bg-[#153E73]/10"
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={category.image}
      alt={category.name}
      width={64}
      height={64}
      className="h-[60%] w-[60%] object-contain"
      priority={index < 5}
      onError={() => setFailed(true)}
    />
  );
}

function CategorySkeleton() {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div className="h-14 w-14 animate-pulse rounded-full bg-[#F1F2F7] md:h-16 md:w-16" />
      <div className="h-3 w-10 animate-pulse rounded bg-[#F1F2F7]" />
    </div>
  );
}

/**
 * Shop home circular main-category menu — 6 slots (5 CMS + 全部分類).
 */
export function ShopMainCategoryMenu({
  categories: categoriesProp,
}: {
  categories?: ShopCategoryItem[];
}) {
  const [categories, setCategories] = useState<ShopCategoryItem[]>(() =>
    buildShopHomeCategories(categoriesProp ?? DEFAULT_SHOP_CATEGORIES)
  );
  const [loading, setLoading] = useState(!categoriesProp);

  useEffect(() => {
    if (categoriesProp) {
      setCategories(buildShopHomeCategories(categoriesProp));
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop/main-categories", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json.categories) ? json.categories : [];
        if (cancelled || !list.length) return;
        setCategories(buildShopHomeCategories(list as ShopCategoryItem[]));
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoriesProp]);

  return (
    <section
      className="shop-category-menu w-full bg-[#FFFEFA]"
      aria-label="商品主分類"
      aria-busy={loading}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div
          className={cn(
            "shop-category-menu__track grid grid-cols-6 gap-2",
            "md:gap-4"
          )}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className={cn(
                    "group flex min-w-0 flex-col items-center gap-1.5 text-center"
                  )}
                  aria-label={category.name}
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full",
                      "transition-transform group-hover:-translate-y-1 group-active:scale-95",
                      "md:h-16 md:w-16"
                    )}
                    style={{ backgroundColor: category.bgColor }}
                  >
                    <CategoryIcon category={category} index={index} />
                  </div>
                  <span className="text-xs font-medium text-[#153E73] md:text-sm">
                    {category.name}
                  </span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/** @deprecated Prefer ShopMainCategoryMenu */
export const ShopCategoryMenu = ShopMainCategoryMenu;
