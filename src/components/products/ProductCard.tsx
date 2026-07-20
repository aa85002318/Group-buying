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
  showQuickAdd?: boolean;
}

const BADGE_CLASS: Record<ProductBadge, string> = {
  new: "bg-primary text-white",
  hot: "bg-error text-white",
  groupBuy: "bg-groupBuy text-white",
  preorder: "bg-warning text-foreground",
  instock: "bg-success text-white",
  soldout: "bg-disabled text-white",
};

const BADGE_LABEL: Record<ProductBadge, string> = {
  new: "新品",
  hot: "熱門",
  groupBuy: "團購",
  preorder: "預購",
  instock: "現貨",
  soldout: "售完",
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
  showQuickAdd = true,
}: ProductCardProps) {
  const link = href ?? `/products/${id}`;
  const groupBuy = Boolean(isGroupBuy || groupBuyLabel || badge === "groupBuy");
  const resolvedBadge: ProductBadge | undefined =
    badge ??
    (groupBuyLabel ? "groupBuy" : undefined) ??
    (sticker ? STICKER_TO_BADGE[sticker] : undefined);
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

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
      });
    } catch {
      /* toast optional in phase 1 */
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <Link href={link} className="relative block aspect-square overflow-hidden bg-surface-soft">
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton productId={id} size="sm" />
        </div>
        {sticker && !resolvedBadge && <ProductSticker type={sticker} />}
        {resolvedBadge && (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-chip px-2 py-0.5 text-[10px] font-bold",
              BADGE_CLASS[resolvedBadge]
            )}
          >
            {groupBuyLabel ?? BADGE_LABEL[resolvedBadge]}
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

      <div className="flex min-h-[7.5rem] flex-1 flex-col gap-1 p-3">
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
            <p className="font-semibold text-price">{formatCurrency(price)}</p>
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
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition active:scale-95 disabled:opacity-50",
                groupBuy ? "bg-groupBuy hover:bg-groupBuy-hover" : "bg-primary hover:bg-primary-hover"
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
