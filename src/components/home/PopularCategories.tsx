"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { CategoryLucideIcon } from "@/components/home/TrustServicesSection";

export type PopularCategoryItem = {
  id: string;
  name: string;
  href: string;
  imageUrl?: string | null;
  icon?: string | null;
  iconBg?: string | null;
};

const DEFAULT_CATEGORIES: PopularCategoryItem[] = [
  { id: "flour", name: "麵粉", href: "/shop/category/flour", icon: "Wheat", iconBg: "#FFE8E2" },
  {
    id: "choco",
    name: "巧克力",
    href: "/shop/category/chocolate",
    icon: "Package",
    iconBg: "#FFF0D6",
  },
  {
    id: "dairy",
    name: "奶油乳酪",
    href: "/shop/category/dairy",
    icon: "Milk",
    iconBg: "#E8F6FF",
  },
  {
    id: "mix",
    name: "預拌粉",
    href: "/shop/category/premix",
    icon: "Package",
    iconBg: "#EAF8F0",
  },
  {
    id: "raw",
    name: "烘焙原料",
    href: "/shop/category/ingredients",
    icon: "Egg",
    iconBg: "#FFE8E2",
  },
  {
    id: "pack",
    name: "包裝材料",
    href: "/shop/category/packaging",
    icon: "Box",
    iconBg: "#F2E7DF",
  },
  {
    id: "tools",
    name: "器具",
    href: "/shop/category/tools",
    icon: "CookingPot",
    iconBg: "#E8F6FF",
  },
  {
    id: "frozen",
    name: "冷凍食品",
    href: "/shop/category/frozen-goods",
    icon: "Snowflake",
    iconBg: "#E8F6FF",
  },
  {
    id: "chill",
    name: "冷藏食品",
    href: "/shop/category/chilled-goods",
    icon: "Refrigerator",
    iconBg: "#EAF8F0",
  },
];

type PopularCategoriesProps = {
  items?: PopularCategoryItem[];
  title?: string;
};

/** 圓形圖入口；支援 Lucide icon 或圖片 */
export function PopularCategories({
  items = DEFAULT_CATEGORIES,
  title = "找材料",
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
                "relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full border border-border-soft min-[375px]:h-[64px] min-[375px]:w-[64px] sm:h-[72px] sm:w-[72px] md:h-auto md:w-full md:aspect-square md:rounded-[18px]"
              )}
              style={{ backgroundColor: item.iconBg || "#FFF5F0" }}
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
                <CategoryLucideIcon name={item.icon} className="h-6 w-6 text-brand-caramel" />
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
