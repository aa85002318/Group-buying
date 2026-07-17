import Link from "next/link";
import {
  CalendarDays,
  CookingPot,
  Snowflake,
  Sparkles,
  Sprout,
  Utensils,
} from "lucide-react";
import type { ProductCategory } from "@/lib/types/database";

interface CategoryGridProps {
  categories: ProductCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const iconBackgrounds = [
    "bg-[#FF8A00]",
    "bg-[#23B26D]",
    "bg-[#268CFF]",
    "bg-[#FFC400]",
    "bg-[#00AFC1]",
    "bg-[#E9288A]",
  ];
  const categoryIcons = [Utensils, Sprout, Snowflake, CookingPot, Sparkles, CalendarDays];

  return (
    <section className="rounded-[20px] bg-white p-4 shadow-card md:p-5">
      <h2 className="mb-4 text-lg font-black text-[#202124]">商品分類</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
        {categories.map((c, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];

          return (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className="group flex min-h-11 flex-col items-center gap-2 rounded-2xl py-1 transition-transform active:scale-95"
            >
              <div
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] text-white shadow-[0_6px_14px_rgba(32,33,36,0.16)] transition-transform duration-200 group-hover:scale-105 group-active:scale-95 sm:h-16 sm:w-16 ${
                  iconBackgrounds[index % iconBackgrounds.length]
                }`}
              >
                <Icon className="h-7 w-7 stroke-[2.25]" aria-hidden />
              </div>
              <span className="line-clamp-2 text-center text-sm font-semibold text-[#202124]">
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
