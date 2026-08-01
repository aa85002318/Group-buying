"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { ProductSticker, type ProductStickerType } from "@/components/brand/ProductSticker";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";

export type ProductBadge = "new" | "hot" | "groupBuy" | "preorder" | "instock" | "soldout";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  href?: string;
  brandOrSpec?: string | null;
  badge?: ProductBadge;
  /** @deprecated prefer badge — kept for existing call sites */
  sticker?: ProductStickerType;
  groupBuyLabel?: string;
  isGroupBuy?: boolean;
  groupBuyEventId?: string | null;
  groupBuyProductId?: string | null;
  showQuickAdd?: boolean;
  /** Shop mall card styling (coral price + yellow cart). */
  variant?: "default" | "shop";
}

const BADGE_CLASS: Record<ProductBadge, string> = {
  new: "bg-brand-yellow text-brand-caramel",
  hot: "bg-surface-coral text-brand-primary",
  groupBuy: "bg-surface-coral text-brand-primary",
  preorder: "bg-surface-yellow text-brand-caramel",
  instock: "bg-success text-white",
  soldout: "bg-disabled-soft text-disabled",
};

/** Shop mall badges — HOT red / NEW orange, 6px radius, 12px type. */
const SHOP_BADGE_CLASS: Partial<Record<ProductBadge, string>> = {
  new: "bg-[#FF8A3D] text-white",
  hot: "bg-[#E53935] text-white",
  soldout: "bg-disabled-soft text-disabled",
};

const BADGE_LABEL: Record<ProductBadge, string> = {
  new: "新品",
  hot: "熱門",
  groupBuy: "團購",
  preorder: "預購",
  instock: "現貨",
  soldout: "售完",
};

const SHOP_BADGE_LABEL: Partial<Record<ProductBadge, string>> = {
  new: "NEW",
  hot: "HOT",
};

const STICKER_TO_BADGE: Partial<Record<ProductStickerType, ProductBadge>> = {
  new: "new",
  hot: "hot",
  live: "hot",
  preorder: "preorder",
  limited: "hot",
};

export function ProductCard({
  id,
  name,
  price,
  original_price,
  image_url,
  href,
  brandOrSpec,
  badge,
  sticker,
  groupBuyLabel,
  isGroupBuy,
  groupBuyEventId,
  groupBuyProductId,
  showQuickAdd = true,
  variant = "default",
}: ProductCardProps) {
  const link = href ?? `/products/${id}`;
  const resolvedBadge: ProductBadge | undefined =
    badge ??
    (isGroupBuy || groupBuyLabel ? "groupBuy" : undefined) ??
    (sticker ? STICKER_TO_BADGE[sticker] : undefined);
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [addedHint, setAddedHint] = useState(false);
  const shop = variant === "shop";

  const onQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || resolvedBadge === "soldout") return;
    setAdding(true);
    try {
      await addItem({
        productId: id,
        name,
        price,
        imageUrl: image_url,
        groupBuyEventId: groupBuyEventId ?? null,
        groupBuyProductId: groupBuyProductId ?? null,
      });
      setAddedHint(true);
      window.setTimeout(() => setAddedHint(false), 1600);
    } catch {
      /* ignore */
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden border bg-surface transition",
        shop
          ? "rounded-[14px] border-[#EEEEEE] shadow-[0_4px_16px_rgba(21,62,115,0.06)]"
          : "rounded-[20px] border-border shadow-soft hover:-translate-y-0.5 hover:shadow-lift"
      )}
    >
      {addedHint ? (
        <div className="absolute inset-x-2 top-2 z-20 rounded-full bg-[#153E73] px-2 py-1 text-center text-[10px] font-bold text-white">
          已加入購物車
        </div>
      ) : null}
      <Link href={link} className="relative block aspect-square overflow-hidden bg-surface-soft">
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton productId={id} size="sm" />
        </div>
        {sticker && !resolvedBadge && <ProductSticker type={sticker} />}
        {resolvedBadge && (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 px-2 py-0.5 font-bold",
              shop
                ? cn(
                    "rounded-[6px] text-xs leading-none",
                    SHOP_BADGE_CLASS[resolvedBadge] ?? BADGE_CLASS[resolvedBadge]
                  )
                : cn("rounded-chip text-[10px]", BADGE_CLASS[resolvedBadge])
            )}
          >
            {groupBuyLabel ??
              (shop
                ? SHOP_BADGE_LABEL[resolvedBadge] ?? BADGE_LABEL[resolvedBadge]
                : BADGE_LABEL[resolvedBadge])}
          </span>
        )}
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-contain p-2"
            sizes="(max-width:768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-foreground-secondary">
            暫無圖片
          </div>
        )}
      </Link>

      <div className={cn("flex flex-1 flex-col gap-1 p-3", shop ? "min-h-[8rem]" : "min-h-[7.5rem]")}>
        <Link href={link} className="min-w-0">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground break-words">
            {name}
          </h3>
          {brandOrSpec && (
            <p className="mt-0.5 line-clamp-1 text-sm text-foreground-secondary">{brandOrSpec}</p>
          )}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <p
              className={cn(
                "font-semibold",
                shop ? "text-[#F0645A]" : "text-brand-primary"
              )}
            >
              {formatCurrency(price)}
            </p>
            {original_price && original_price > price && (
              <p className="text-xs text-foreground-muted line-through">
                {formatCurrency(original_price)}
              </p>
            )}
          </div>
          {showQuickAdd && (
            <button
              type="button"
              onClick={onQuickAdd}
              disabled={adding || resolvedBadge === "soldout"}
              aria-label="將商品加入購物車"
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center transition active:scale-95 disabled:opacity-50",
                shop
                  ? "rounded-full bg-[#FFD54F] text-[#153E73] hover:brightness-95"
                  : "rounded-xl bg-brand-primary text-white hover:bg-primary-hover"
              )}
            >
              <Plus className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
