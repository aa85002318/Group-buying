"use client";

import Link from "next/link";
import Image from "next/image";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, cn } from "@/lib/utils";
import {
  PRODUCT_RAIL_BODY,
  PRODUCT_RAIL_CARD_SHELL,
  PRODUCT_RAIL_IMAGE,
  PRODUCT_RAIL_IMAGE_FRAME,
} from "@/lib/ui/product-rail";

export type ShopRailBadge = "new" | "hot" | "soldout" | "sale" | "bundle";

const BADGE_STYLES: Record<ShopRailBadge, { label: string; className: string }> = {
  new: { label: "NEW", className: "bg-[#FF8A3D] text-white" },
  hot: { label: "HOT", className: "bg-[#E53935] text-white" },
  sale: { label: "優惠", className: "bg-[#F16458] text-white" },
  bundle: { label: "組合", className: "bg-[#153E73] text-white" },
  soldout: { label: "售完", className: "bg-[#E9EDF2] text-[#687386]" },
};

/** @deprecated use PRODUCT_RAIL_CARD_WIDTH from product-rail */
export const SHOP_RAIL_CARD_WIDTH =
  "w-[calc((100vw-48px)/2.15)] min-w-[156px] max-w-[176px] md:w-[210px] md:min-w-[210px] md:max-w-[210px] xl:w-[220px] xl:min-w-[220px] xl:max-w-[220px]";

type ShopProductRailCardProps = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  badge?: ShopRailBadge | null;
  href?: string;
};

/**
 * Shop hub rail card — full-bleed image + white text/CTA footer.
 * Click → product (or custom href) detail; yellow + → cart.
 */
export function ShopProductRailCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  badge,
  href,
}: ShopProductRailCardProps) {
  const { addItem } = useCart();
  const soldOut = badge === "soldout";
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const link = href ?? `/shop/products/${id}`;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut || adding) return;
    setAdding(true);
    setToast(null);
    try {
      await addItem({
        productId: id,
        name,
        price,
        imageUrl,
        quantity: 1,
      });
      setToast("已加入購物車");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "加入失敗");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={cn(
        PRODUCT_RAIL_CARD_SHELL,
        !soldOut && "md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)]"
      )}
    >
      <Link
        href={link}
        className={cn(PRODUCT_RAIL_IMAGE_FRAME, soldOut && "opacity-60")}
        aria-label={name}
      >
        {badge ? (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-[6px] px-2 py-0.5 text-xs font-semibold leading-none",
              BADGE_STYLES[badge].className
            )}
          >
            {BADGE_STYLES[badge].label}
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
            alt={name}
            fill
            className={PRODUCT_RAIL_IMAGE}
            sizes="(max-width: 767px) 176px, (max-width: 1279px) 210px, 220px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#687386]">
            暫無圖片
          </div>
        )}
      </Link>

      <div className={PRODUCT_RAIL_BODY}>
        <Link href={link}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Link href={link} className="min-w-0">
            <span className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
              {formatCurrency(price)}
            </span>
            {originalPrice != null && originalPrice > price ? (
              <p className="mt-0.5 text-[11px] text-[#687386] line-through md:text-xs">
                {formatCurrency(originalPrice)}
              </p>
            ) : null}
          </Link>

          <button
            type="button"
            aria-label="加入購物車"
            disabled={soldOut || adding}
            onClick={onAdd}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFD454] text-[#153E73] transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:w-10"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin md:h-[19px] md:w-[19px]" aria-hidden />
            ) : (
              <Plus className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        {toast ? (
          <p className="mt-1 text-center text-[10px] font-medium text-[#153E73]" role="status">
            {toast}
          </p>
        ) : null}
      </div>
    </article>
  );
}
