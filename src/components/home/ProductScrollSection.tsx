import Link from "next/link";
import {
  HomeProductCard,
  type HomeProductCardVariant,
} from "@/components/home/HomeProductCard";
import type { HomeProduct } from "@/lib/home";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductScrollSectionProps {
  title: string;
  products: HomeProduct[];
  seeMoreHref?: string;
  showCutoff?: boolean;
  emptyText?: string;
  fourPerRow?: boolean;
  variant?: HomeProductCardVariant;
  badge?: string;
  badgeTone?: "new" | "hot" | "live" | "mint";
}

const BADGE_CLASS = {
  new: "bg-primary text-white",
  hot: "bg-error text-white",
  live: "bg-error text-white",
  mint: "bg-success text-white",
};

export function ProductScrollSection({
  title,
  products,
  seeMoreHref,
  emptyText = "暫無商品",
  variant = "new",
  badge,
  badgeTone = "new",
}: ProductScrollSectionProps) {
  const isClosing = variant === "closing";
  const isRanking = variant === "ranking";

  return (
    <section
      className={cn(
        isClosing
          ? "rounded-[22px] border-2 border-error bg-card p-3 shadow-lift md:p-4"
          : "py-1"
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-between gap-3",
          isClosing && "rounded-2xl bg-brand-gradient px-4 py-3 text-white"
        )}
      >
        <div className="flex items-center gap-2">
          {!isClosing && (
            <span className="h-7 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          )}
          <h2 className={cn("text-xl font-black", isClosing ? "text-white" : "text-foreground")}>
            {title}
          </h2>
          {badge && (
            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black", BADGE_CLASS[badgeTone])}>
              {badge}
            </span>
          )}
        </div>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 text-sm font-bold",
              isClosing ? "text-white" : "text-primary"
            )}
          >
            查看更多
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <p className="py-4 text-center text-sm text-foreground-secondary">{emptyText}</p>
      ) : (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 scrollbar-none">
          {products.map((p, index) => (
            <div
              key={`${p.id}-${p.cutoff_at ?? ""}-${index}`}
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
