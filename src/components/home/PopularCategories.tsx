"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";

export type PopularCategoryItem = {
  id: string;
  name: string;
  href: string;
  imageUrl?: string | null;
};

const DEFAULT_CATEGORIES: PopularCategoryItem[] = [
  { id: "flour", name: "麵粉", href: "/products?search=麵粉", imageUrl: "/categories/food.png" },
  {
    id: "choco",
    name: "巧克力",
    href: "/products?search=巧克力",
    imageUrl: "/categories/fresh.png",
  },
  {
    id: "dairy",
    name: "乳製品",
    href: "/products?search=乳製品",
    imageUrl: "/categories/kitchen.png",
  },
  {
    id: "tools",
    name: "器具",
    href: "/products?search=器具",
    imageUrl: "/categories/seasonal.png",
  },
  {
    id: "pack",
    name: "包裝",
    href: "/products?search=包裝",
    imageUrl: "/categories/cleaning.png",
  },
  {
    id: "frozen",
    name: "冷凍",
    href: "/products?search=冷凍",
    imageUrl: "/categories/frozen.png",
  },
  {
    id: "chill",
    name: "冷藏",
    href: "/products?search=冷藏",
    imageUrl: "/categories/fresh.png",
  },
  {
    id: "mix",
    name: "預拌粉",
    href: "/products?search=預拌粉",
    imageUrl: "/categories/food.png",
  },
];

type PopularCategoriesProps = {
  items?: PopularCategoryItem[];
  title?: string;
};

/** 圓形圖入口，一次約 5–6 個 */
export function PopularCategories({
  items = DEFAULT_CATEGORIES,
  title = "熱門分類",
}: PopularCategoriesProps) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-brand-caramel">{title}</h2>
      <HorizontalScroller className="gap-3 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible lg:grid-cols-8">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex w-[58px] shrink-0 flex-col items-center gap-1.5 min-[375px]:w-[64px] sm:w-[72px] md:w-auto"
          >
            <span
              className={cn(
                "relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full border border-border-soft bg-surface-soft min-[375px]:h-[64px] min-[375px]:w-[64px] sm:h-[72px] sm:w-[72px] md:h-auto md:w-full md:aspect-square md:rounded-[18px]"
              )}
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                />
              ) : (
                <span className="text-xs font-bold text-brand-caramel">
                  {item.name.slice(0, 2)}
                </span>
              )}
            </span>
            <span className="line-clamp-1 text-center text-[12px] font-medium text-brand-caramel">
              {item.name}
            </span>
          </Link>
        ))}
      </HorizontalScroller>
    </section>
  );
}
