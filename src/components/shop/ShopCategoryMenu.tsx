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
      className="h-[58%] w-[58%] object-contain"
      priority={index < 5}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Shop home circular category menu — directly under search.
 * Desktop: 9 equal columns. Tablet/mobile: horizontal scroll, single row.
 */
export function ShopCategoryMenu({
  categories: categoriesProp,
}: {
  categories?: ShopCategoryItem[];
}) {
  const [categories, setCategories] = useState<ShopCategoryItem[]>(() =>
    buildShopHomeCategories(categoriesProp ?? DEFAULT_SHOP_CATEGORIES)
  );

  useEffect(() => {
    if (categoriesProp) {
      setCategories(buildShopHomeCategories(categoriesProp));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop/home-categories", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json.categories) ? json.categories : [];
        if (cancelled || !list.length) return;
        setCategories(buildShopHomeCategories(list as ShopCategoryItem[]));
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoriesProp]);

  return (
    <section
      className="shop-category-menu w-full bg-white"
      aria-label="商品分類"
    >
      <div className="shop-category-menu__inner mx-auto max-w-[1200px] px-4">
        <div
          className={cn(
            "shop-category-menu__track flex gap-3 overflow-x-auto py-1",
            "scrollbar-hide md:gap-4",
            "lg:grid lg:grid-cols-9 lg:gap-3 lg:overflow-visible"
          )}
        >
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={category.href}
              className={cn(
                "group flex min-w-[72px] flex-col items-center gap-2",
                "md:min-w-[88px] lg:min-w-0"
              )}
              aria-label={category.name}
            >
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-full",
                  "shadow-[0_4px_12px_rgba(21,62,115,0.06)]",
                  "transition-transform duration-200 group-hover:-translate-y-1 group-active:scale-95",
                  "md:h-[76px] md:w-[76px] lg:h-[88px] lg:w-[88px]"
                )}
                style={{ backgroundColor: category.bgColor }}
              >
                <CategoryIcon category={category} index={index} />
              </div>
              <span className="max-w-[4.5rem] text-center text-xs font-medium leading-snug text-[#153E73] md:max-w-none md:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
