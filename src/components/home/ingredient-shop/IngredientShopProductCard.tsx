"use client";

import Link from "next/link";
import Image from "next/image";
import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
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

type IngredientShopProductCardProps = {
  product: IngredientShopProduct;
};

export function IngredientShopProductCard({ product }: IngredientShopProductCardProps) {
  const { addItem } = useCart();
  const soldOut = isProductSoldOut(product);
  const maxQty = Math.max(1, Number(product.stock) || 1);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const href = `/products/${product.id}`;
  const spec = product.unit || product.subtitle || product.short_description;

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
        quantity,
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

  const dec = () => setQuantity((q) => Math.max(1, q - 1));
  const inc = () => setQuantity((q) => Math.min(maxQty, q + 1));

  return (
    <article
      className={cn(
        "ingredient-shop-card group flex w-[78vw] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-[#E9EDF2] bg-white p-4 shadow-[0_8px_24px_rgba(21,62,115,0.06)] transition duration-300 md:w-[270px] md:max-w-none",
        !soldOut && "md:hover:-translate-y-0.5 md:hover:shadow-[0_12px_28px_rgba(21,62,115,0.1)]"
      )}
    >
      <div className="relative">
        <Link
          href={href}
          className={cn(
            "relative block aspect-square overflow-hidden rounded-2xl bg-[#FFFEFA]",
            soldOut && "opacity-60"
          )}
        >
          {product.badge ? (
            <span
              className={cn(
                "absolute left-3 top-3 z-10 rounded-full px-2.5 py-1.5 text-xs font-semibold",
                BADGE_STYLES[product.badge].className
              )}
            >
              {BADGE_STYLES[product.badge].label}
            </span>
          ) : null}
          <div className="absolute right-2 top-2 z-10">
            <FavoriteButton
              productId={product.id}
              className="!h-10 !w-10 !rounded-full !border !border-[#E9EDF2] !bg-white !shadow-sm"
            />
          </div>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 767px) 78vw, 270px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#687386]">
              暫無圖片
            </div>
          )}
        </Link>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[48px] text-[15px] font-semibold leading-snug text-[#153E73]">
            {product.name}
          </h3>
        </Link>
        {spec ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#687386]">{spec}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-[#F16458]">
            {formatCurrency(product.displayPrice)}
          </span>
          {product.displayOriginalPrice != null ? (
            <span className="text-sm text-[#687386] line-through">
              {formatCurrency(product.displayOriginalPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div
            className={cn(
              "inline-flex h-10 items-center overflow-hidden rounded-xl border border-[#E9EDF2]",
              soldOut && "opacity-50"
            )}
          >
            <button
              type="button"
              aria-label="減少數量"
              disabled={soldOut || quantity <= 1}
              onClick={dec}
              className="inline-flex h-10 w-10 items-center justify-center text-[#153E73] disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[28px] text-center text-sm font-semibold text-[#153E73]">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="增加數量"
              disabled={soldOut || quantity >= maxQty}
              onClick={inc}
              className="inline-flex h-10 w-10 items-center justify-center text-[#153E73] disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            aria-label="加入購物車"
            disabled={soldOut || adding}
            onClick={onAdd}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFD454] text-[#153E73] transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <ShoppingCart className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        {toast ? (
          <p className="mt-2 text-center text-xs font-medium text-[#153E73]" role="status">
            {toast}
          </p>
        ) : null}
      </div>
    </article>
  );
}
