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
          ? "rounded-[20px] border-2 border-[#E9285C] bg-white p-3 shadow-[0_14px_34px_rgba(184,22,72,0.18)] md:p-4"
          : "py-2"
      }
    >
      <div
        className={
          isClosing
            ? "mb-4 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#B81648] to-[#E9285C] px-4 py-3 text-white"
            : "mb-4 flex items-center justify-between gap-3"
        }
      >
        <div className="flex items-center gap-2">
          {variant === "new" && (
            <span className="h-7 w-1.5 shrink-0 rounded-full bg-[#E9285C]" aria-hidden />
          )}
          <h2
            className={
              isClosing
                ? "text-xl font-black text-white"
                : "text-xl font-black text-[#202124]"
            }
          >
            {title}
          </h2>
          {variant === "new" && (
            <span className="rounded-full bg-[#A93DDB] px-2.5 py-1 text-[10px] font-black text-white">
              NEW
            </span>
          )}
        </div>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className={
              isClosing
                ? "inline-flex min-h-11 items-center gap-1 text-sm font-bold text-white"
                : "inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[#E9285C]"
            }
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
