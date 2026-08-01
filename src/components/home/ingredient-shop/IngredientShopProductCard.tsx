"use client";

import Link from "next/link";
import Image from "next/image";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, cn } from "@/lib/utils";
import { isProductSoldOut } from "@/lib/home/ingredient-shop";
import {
  PRODUCT_RAIL_BODY,
  PRODUCT_RAIL_CARD_SHELL,
  PRODUCT_RAIL_IMAGE,
  PRODUCT_RAIL_IMAGE_FRAME,
} from "@/lib/ui/product-rail";
import type { HomeProductBadgeType, IngredientShopProduct } from "@/types/home-product-section";

const BADGE_STYLES: Record<
  HomeProductBadgeType,
  { label: string; className: string }
> = {
  hot: { label: "熱銷", className: "bg-[#F16458] text-white" },
  recommend: { label: "推薦", className: "bg-[#79C7E8] text-[#153E73]" },
  limited: { label: "限定", className: "bg-[#A8D5BA] text-[#153E73]" },
  new: { label: "新品", className: "bg-[#FFD454] text-[#153E73]" },
  sold_out: { label: "售罄", className: "bg-[#E9EDF2] text-[#687386]" },
};

type IngredientShopProductCardProps = {
  product: IngredientShopProduct;
};

/**
 * Ingredient shop quick-buy card: full-bleed image + white text/CTA footer.
 * Card click → product detail; yellow + → add to cart.
 */
export function IngredientShopProductCard({ product }: IngredientShopProductCardProps) {
  const { addItem } = useCart();
  const soldOut = isProductSoldOut(product);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const href = `/products/${product.id}`;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut || adding) return;
    setAdding(true);
    setToast(null);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.displayPrice,
        imageUrl: product.image_url,
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
        href={href}
        className={cn(PRODUCT_RAIL_IMAGE_FRAME, soldOut && "opacity-60")}
        aria-label={product.name}
      >
        {product.badge ? (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-[6px] px-2 py-0.5 text-xs font-semibold",
              BADGE_STYLES[product.badge].className
            )}
          >
            {BADGE_STYLES[product.badge].label}
          </span>
        ) : null}
        <span
          className="absolute right-1.5 top-1.5 z-10"
          onClick={(e) => e.preventDefault()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <FavoriteButton
            productId={product.id}
            size="sm"
            className="!h-8 !w-8 !rounded-full !border !border-[#E9EDF2] !bg-white/95 !shadow-none md:!h-[34px] md:!w-[34px]"
          />
        </span>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
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
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Link href={href} className="min-w-0">
            <span className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
              {formatCurrency(product.displayPrice)}
            </span>
            {product.displayOriginalPrice != null ? (
              <p className="mt-0.5 text-[11px] text-[#687386] line-through md:text-xs">
                {formatCurrency(product.displayOriginalPrice)}
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
