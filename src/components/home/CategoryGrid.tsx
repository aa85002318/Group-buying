import Link from "next/link";
import Image from "next/image";
import type { ProductCategory } from "@/lib/types/database";
import { getCategoryDisplayIcon } from "@/lib/home";

interface CategoryGridProps {
  categories: ProductCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-coffee">商品分類</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
        {categories.map((c) => {
          const icon = getCategoryDisplayIcon(c);
          const hasSticker = icon.type === "image";

          return (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className="flex flex-col items-center gap-1 transition-opacity hover:opacity-85"
            >
              {hasSticker ? (
                <div className="relative aspect-square w-full max-w-[108px] sm:max-w-[120px]">
                  <Image
                    src={icon.value}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 33vw, 120px"
                    className="object-contain drop-shadow-sm"
                    unoptimized
                  />
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#F7DADA] bg-[#FFF8F5] sm:h-16 sm:w-16">
                    <span className="text-2xl leading-none sm:text-[1.75rem]">{icon.value}</span>
                  </div>
                  <span className="line-clamp-2 text-center text-sm text-[#333333]">{c.name}</span>
                </>
              )}
              {hasSticker ? <span className="sr-only">{c.name}</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
