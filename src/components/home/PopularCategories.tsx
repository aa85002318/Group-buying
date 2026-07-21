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
  { id: "flour", name: "麵粉", href: "/products?search=麵粉" },
  { id: "choco", name: "巧克力", href: "/products?search=巧克力" },
  { id: "dairy", name: "乳製品", href: "/products?search=乳製品" },
  { id: "tools", name: "器具", href: "/products?search=器具" },
  { id: "pack", name: "包裝", href: "/products?search=包裝" },
  { id: "frozen", name: "冷凍", href: "/products?search=冷凍" },
  { id: "chill", name: "冷藏", href: "/products?search=冷藏" },
  { id: "mix", name: "預拌粉", href: "/products?search=預拌粉" },
];

type PopularCategoriesProps = {
  items?: PopularCategoryItem[];
  activeId?: string;
  title?: string;
};

export function PopularCategories({
  items = DEFAULT_CATEGORIES,
  activeId,
  title = "熱門分類",
}: PopularCategoriesProps) {
  const wells = ["bg-surface-yellow", "bg-surface-peach", "bg-surface-coral", "bg-section"];

  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-brand-caramel">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {items.map((item, index) => {
          const active = activeId === item.id;
          const well = wells[index % wells.length];
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-2xl p-1 transition duration-200 hover:-translate-y-0.5",
                active && "bg-surface-coral"
              )}
            >
              <span
                className={cn(
                  "relative flex aspect-square h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-border bg-surface shadow-soft",
                  !item.imageUrl && well,
                  active && "border-brand-primary"
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
                  <span className="px-1 text-center text-[11px] font-bold leading-tight text-brand-caramel">
                    {item.name.slice(0, 2)}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "line-clamp-2 text-center text-[13px] font-medium leading-tight",
                  active ? "text-brand-primary" : "text-brand-caramel"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
