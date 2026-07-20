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

const FALLBACK: PopularCategoryItem[] = [
  { id: "flour", name: "麵粉", href: "/products?search=麵粉" },
  { id: "dairy", name: "奶油與乳製品", href: "/products?search=奶油" },
  { id: "sugar", name: "糖類", href: "/products?search=糖" },
  { id: "choco", name: "巧克力", href: "/products?search=巧克力" },
  { id: "pack", name: "包裝材料", href: "/products?search=包裝" },
  { id: "tools", name: "烘焙器具", href: "/products?search=模" },
  { id: "frozen", name: "冷凍食材", href: "/products?search=冷凍" },
  { id: "deco", name: "裝飾材料", href: "/products?search=裝飾" },
];

type PopularCategoriesProps = {
  items?: PopularCategoryItem[];
  activeId?: string;
};

export function PopularCategories({ items = FALLBACK, activeId }: PopularCategoriesProps) {
  return (
    <section aria-label="熱門分類">
      <h2 className="mb-3 text-base font-bold text-foreground">熱門分類</h2>
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max gap-3 md:grid md:w-full md:grid-cols-8 md:gap-3">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id} className="w-[72px] shrink-0 md:w-auto">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl p-1 transition",
                    active && "bg-primary-soft"
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border bg-surface-soft md:h-16 md:w-16",
                      active ? "border-primary" : "border-border"
                    )}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs font-bold text-caramel">
                        {item.name.slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "line-clamp-2 text-center text-sm font-medium leading-tight",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
