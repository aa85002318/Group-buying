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
  { id: "flour", name: "麵粉與預拌粉", href: "/products?search=麵粉" },
  { id: "choco", name: "巧克力", href: "/products?search=巧克力" },
  { id: "dairy", name: "乳製品", href: "/products?search=奶油" },
  { id: "tools", name: "烘焙器具", href: "/products?search=模" },
  { id: "pack", name: "包裝材料", href: "/products?search=包裝" },
  { id: "frozen", name: "冷凍冷藏", href: "/products?search=冷凍" },
];

type PopularCategoriesProps = {
  items?: PopularCategoryItem[];
  activeId?: string;
  title?: string;
};

export function PopularCategories({
  items = DEFAULT_CATEGORIES,
  activeId,
  title = "今天想買什麼？",
}: PopularCategoriesProps) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-caramel">{title}</h2>
      <div className="h-scroll md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max gap-3 md:grid md:w-full md:grid-cols-6 md:gap-3">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id} className="w-[76px] shrink-0 md:w-auto">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl p-1 transition",
                    active && "bg-primary-soft"
                  )}
                >
                  <span
                    className={cn(
                      "relative flex aspect-square h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border bg-surface shadow-card md:h-16 md:w-16",
                      active ? "border-primary" : "border-border-soft"
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
                      <span className="bg-peach-soft px-2 text-center text-[11px] font-bold leading-tight text-caramel">
                        {item.name.slice(0, 2)}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "line-clamp-2 text-center text-[13px] font-medium leading-tight",
                      active ? "text-primary" : "text-caramel"
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
