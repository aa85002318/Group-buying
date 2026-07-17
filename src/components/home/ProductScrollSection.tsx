import Link from "next/link";
import {
  HomeProductCard,
  type HomeProductCardVariant,
} from "@/components/home/HomeProductCard";
import type { HomeProduct } from "@/lib/home";
import { ArrowRight } from "lucide-react";

interface ProductScrollSectionProps {
  title: string;
  products: HomeProduct[];
  seeMoreHref?: string;
  showCutoff?: boolean;
  emptyText?: string;
  fourPerRow?: boolean;
  variant?: HomeProductCardVariant;
}

export function ProductScrollSection({
  title,
  products,
  seeMoreHref,
  emptyText = "暫無商品",
  variant = "new",
}: ProductScrollSectionProps) {
  const isClosing = variant === "closing";
  const isRanking = variant === "ranking";

  return (
    <section
      className={
        isClosing
          ? "rounded-[20px] bg-gradient-to-br from-[#FFF1F3] to-[#FFF5EB] p-4 md:p-5"
          : "py-2"
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2
            className={
              isClosing
                ? "text-xl font-black text-[#E92D2D]"
                : "text-xl font-black text-[#222222]"
            }
          >
            {title}
          </h2>
          {variant === "new" && (
            <span className="rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#F43F5E] px-2.5 py-1 text-[10px] font-black text-white">
              NEW
            </span>
          )}
        </div>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[#F43F5E]"
          >
            查看更多
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 scrollbar-none">
          {products.map((p, index) => (
            <div
              key={`${p.id}-${p.cutoff_at ?? ""}`}
              className={
                isRanking
                  ? "w-[88%] shrink-0 snap-start sm:w-[48%] lg:w-[calc((100%_-_1.5rem)_/_3)]"
                  : "w-[72%] shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[calc((100%_-_2.25rem)_/_4)]"
              }
            >
              <HomeProductCard product={p} variant={variant} rank={index + 1} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
