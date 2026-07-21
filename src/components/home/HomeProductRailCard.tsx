"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";

export type HomeProductRailBadge = "new" | "hot" | "sale";

type HomeProductRailCardProps = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  spec?: string | null;
  badge?: HomeProductRailBadge;
  className?: string;
};

const BADGE: Record<HomeProductRailBadge, { label: string; className: string }> = {
  new: { label: "新品", className: "bg-[var(--yellow)] text-brand-caramel" },
  hot: { label: "熱銷", className: "bg-primary-soft text-primary-hover" },
  sale: { label: "折扣", className: "bg-[var(--yellow-soft)] text-brand-caramel" },
};

/** Compact commerce card used by home product rails. */
export function HomeProductRailCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  spec,
  badge,
  className,
}: HomeProductRailCardProps) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const href = `/products/${id}`;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await addItem({ productId: id, name, price, imageUrl });
    } catch {
      /* ignore */
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={cn(
        "flex w-[148px] min-w-0 shrink-0 flex-col overflow-hidden rounded-[16px] border border-border-soft bg-surface",
        "shadow-soft",
        "min-[375px]:w-[158px] sm:w-[164px] md:w-auto",
        className
      )}
    >
      <Link href={href} className="home-product-image-bg relative block aspect-square">
        {badge ? (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold",
              BADGE[badge].className
            )}
          >
            {BADGE[badge].label}
          </span>
        ) : null}
        <div className="absolute right-1.5 top-1.5 z-10">
          <FavoriteButton productId={id} size="sm" className="!h-8 !w-8" />
        </div>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-contain p-2"
            sizes="(max-width: 374px) 148px, (max-width: 767px) 158px, 220px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
            暫無圖片
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-snug text-brand-caramel">
            {name}
          </h3>
          {spec ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-foreground-secondary">{spec}</p>
          ) : null}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-1 pt-1.5">
          <div className="min-w-0">
            <p className="whitespace-nowrap text-sm font-bold text-price">
              {formatCurrency(price)}
            </p>
            {originalPrice != null && originalPrice > price ? (
              <p className="text-[10px] text-foreground-muted line-through">
                {formatCurrency(originalPrice)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            aria-label="加入購物車"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition duration-200 hover:bg-primary-hover disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
