"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
      <div className="flex gap-3 overflow-x-auto pb-0.5 scrollbar-none">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex w-[64px] shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "relative flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full border border-border-soft bg-surface-soft"
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
      </div>
    </section>
  );
}
