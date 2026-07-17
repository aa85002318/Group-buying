import Link from "next/link";
import Image from "next/image";
import type { ProductCategory } from "@/lib/types/database";
import { getCategoryDisplayIcon } from "@/lib/home";

interface CategoryGridProps {
  categories: ProductCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const iconBackgrounds = [
    "bg-[#FFE4E9] text-[#E92D2D]",
    "bg-[#FFF0D9] text-[#C55300]",
    "bg-[#FFF4BF] text-[#8A5A00]",
    "bg-[#DFF7EC] text-[#15805D]",
    "bg-[#E7E7FF] text-[#5145CD]",
    "bg-[#F3E8FF] text-[#9333EA]",
  ];

  return (
    <section className="rounded-[20px] bg-white p-4 shadow-card md:p-5">
      <h2 className="mb-4 text-lg font-black text-[#222222]">商品分類</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
        {categories.map((c, index) => {
          const icon = getCategoryDisplayIcon(c);
          const hasSticker = icon.type === "image";

          return (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className="group flex min-h-11 flex-col items-center gap-2 rounded-2xl py-1 transition-transform active:scale-95"
            >
              <div
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm transition-transform duration-200 group-hover:scale-105 group-active:scale-95 sm:h-16 sm:w-16 ${
                  iconBackgrounds[index % iconBackgrounds.length]
                }`}
              >
                {hasSticker ? (
                  <Image
                    src={icon.value}
                    alt={c.name}
                    fill
                    sizes="64px"
                    className="object-contain p-2 drop-shadow-sm"
                    unoptimized
                  />
                ) : (
                    <span className="text-2xl leading-none sm:text-[1.75rem]">{icon.value}</span>
                )}
              </div>
              <span className="line-clamp-2 text-center text-sm font-semibold text-[#333333]">
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
