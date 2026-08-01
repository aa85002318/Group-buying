"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import {
  PRODUCT_RAIL_BODY,
  PRODUCT_RAIL_CARD_SHELL,
  PRODUCT_RAIL_IMAGE,
  PRODUCT_RAIL_IMAGE_FRAME,
} from "@/lib/ui/product-rail";

export type HomeProductRailBadge = "new" | "hot" | "sale";

type HomeProductRailCardProps = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  /** @deprecated unused — cards show name only */
  spec?: string | null;
  badge?: HomeProductRailBadge;
  href?: string;
  className?: string;
};

const BADGE: Record<HomeProductRailBadge, { label: string; className: string }> = {
  new: { label: "新品", className: "bg-[var(--yellow)] text-brand-caramel" },
  hot: { label: "熱銷", className: "bg-primary-soft text-primary-hover" },
  sale: { label: "折扣", className: "bg-[var(--yellow-soft)] text-brand-caramel" },
};

/** Compact commerce card sized like homepage「一鍵買齊材料」. */
export function HomeProductRailCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  badge,
  href: hrefProp,
  className,
}: HomeProductRailCardProps) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const href = hrefProp || `/products/${id}`;

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
    <article className={cn(PRODUCT_RAIL_CARD_SHELL, className)}>
      <Link href={href} className={PRODUCT_RAIL_IMAGE_FRAME} aria-label={name}>
        {badge ? (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-[6px] px-2 py-0.5 text-xs font-bold leading-none",
              BADGE[badge].className
            )}
          >
            {BADGE[badge].label}
          </span>
        ) : null}
        <span
          className="absolute right-1.5 top-1.5 z-10"
          onClick={(e) => e.preventDefault()}
        >
          <FavoriteButton
            productId={id}
            size="sm"
            className="!h-8 !w-8 !rounded-full !border !border-[#E9EDF2] !bg-white/95 !shadow-none md:!h-[34px] md:!w-[34px]"
          />
        </span>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className={PRODUCT_RAIL_IMAGE}
            sizes="(max-width: 767px) 176px, (max-width: 1279px) 210px, 220px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
            暫無圖片
          </div>
        )}
      </Link>
      <div className={PRODUCT_RAIL_BODY}>
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {name}
          </h3>
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Link href={href} className="min-w-0">
            <p className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
              {formatCurrency(price)}
            </p>
            {originalPrice != null && originalPrice > price ? (
              <p className="mt-0.5 text-[11px] text-[#687386] line-through md:text-xs">
                {formatCurrency(originalPrice)}
              </p>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            aria-label="加入購物車"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFD454] text-[#153E73] transition hover:brightness-95 disabled:opacity-50 md:h-10 md:w-10"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
