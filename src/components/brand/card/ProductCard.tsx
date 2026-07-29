"use client";

import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { BrandCard } from "./BrandCard";
import { BrandTag } from "@/components/brand/tag/BrandTag";
import { BrandButton } from "@/components/brand/button/BrandButton";
import { formatCurrency } from "@/lib/utils";
import type { ProductCardProps } from "./types";

export function ProductCard({
  name,
  href,
  imageUrl,
  spec,
  price,
  originalPrice,
  appPrice,
  badges = [],
  favorited,
  onFavorite,
  onAddToCart,
  className,
}: ProductCardProps) {
  return (
    <div className={className}>
      <BrandCard
        href={href}
        image={imageUrl}
        imageAlt={name}
        title={name}
        description={spec}
        badges={
          <>
            {badges.map((b) => (
              <BrandTag
                key={b}
                variant={
                  b === "new" ? "new" : b === "sale" ? "sale" : b === "limited" ? "limited" : "popular"
                }
              >
                {b === "new" ? "新品" : b === "sale" ? "特價" : b === "limited" ? "限時" : "熱賣"}
              </BrandTag>
            ))}
          </>
        }
        footer={
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-bold text-[var(--brand-primary)]">
                {formatCurrency(price)}
              </span>
              {originalPrice != null && originalPrice > price ? (
                <span className="text-xs text-[var(--brand-text-muted)] line-through">
                  {formatCurrency(originalPrice)}
                </span>
              ) : null}
              {appPrice != null ? (
                <span className="text-[11px] font-semibold text-[var(--brand-text-secondary)]">
                  App {formatCurrency(appPrice)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {onFavorite ? (
                <button
                  type="button"
                  aria-label={favorited ? "取消收藏" : "收藏"}
                  className="brand-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--brand-border)]"
                  onClick={onFavorite}
                >
                  <Heart
                    className="h-4 w-4"
                    fill={favorited ? "var(--brand-primary)" : "none"}
                    color="var(--brand-primary)"
                  />
                </button>
              ) : null}
              {onAddToCart ? (
                <BrandButton size="sm" className="flex-1" onClick={onAddToCart}>
                  <Plus className="h-4 w-4" aria-hidden />
                  加入購物車
                </BrandButton>
              ) : (
                <Link href={href} className="flex-1">
                  <BrandButton size="sm" fullWidth>
                    查看商品
                  </BrandButton>
                </Link>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
