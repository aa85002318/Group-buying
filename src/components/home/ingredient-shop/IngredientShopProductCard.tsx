"use client";

import Link from "next/link";
import Image from "next/image";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, cn } from "@/lib/utils";
import { isProductSoldOut } from "@/lib/home/ingredient-shop";
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

const CARD_WIDTH =
  "w-[calc((100vw-48px)/2.15)] min-w-[156px] max-w-[176px] md:w-[210px] md:min-w-[210px] md:max-w-[210px] xl:w-[220px] xl:min-w-[220px] xl:max-w-[220px]";

type IngredientShopProductCardProps = {
  product: IngredientShopProduct;
};

/**
 * Ingredient shop quick-buy card: image, name, price, add-to-cart only.
 */
export function IngredientShopProductCard({ product }: IngredientShopProductCardProps) {
  const { addItem } = useCart();
  const soldOut = isProductSoldOut(product);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const href = `/products/${product.id}`;

  const onAdd = async () => {
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
    } catch (e) {
      setToast(e instanceof Error ? e.message : "加入失敗");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={cn(
        "ingredient-shop-card group flex h-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#E9EDF2] bg-white p-2.5 shadow-[0_5px_16px_rgba(21,62,115,0.05)] transition duration-300 md:h-[320px] md:p-3",
        CARD_WIDTH,
        !soldOut && "md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)]"
      )}
    >
      <div className="relative">
        <Link
          href={href}
          className={cn(
            "relative block h-[135px] overflow-hidden rounded-xl bg-[#FFFEFA] md:h-[165px] xl:h-[170px]",
            soldOut && "opacity-60"
          )}
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
          <div className="absolute right-1.5 top-1.5 z-10">
            <FavoriteButton
              productId={product.id}
              size="sm"
              className="!h-8 !w-8 !rounded-full !border !border-[#E9EDF2] !bg-white/95 !shadow-none md:!h-[34px] md:!w-[34px]"
            />
          </div>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-2.5 md:p-3.5"
              sizes="(max-width: 767px) 176px, (max-width: 1279px) 210px, 220px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#687386]">
              暫無圖片
            </div>
          )}
        </Link>
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <span className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
              {formatCurrency(product.displayPrice)}
            </span>
            {product.displayOriginalPrice != null ? (
              <p className="mt-0.5 text-[11px] text-[#687386] line-through md:text-xs">
                {formatCurrency(product.displayOriginalPrice)}
              </p>
            ) : null}
          </div>

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
