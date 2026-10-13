"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { useCart } from "@/hooks/useCart";
import { productPath } from "@/lib/site-links";
import { formatCurrency, cn } from "@/lib/utils";

type DesktopProductCardProps = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  spec?: string | null;
  href?: string;
  showSpec?: boolean;
  showFavorite?: boolean;
  showAddToCart?: boolean;
  /** Dense listing: 1:1 frame with the photo contained at 80% of it. */
  compact?: boolean;
  className?: string;
};

export function DesktopProductCard({
  id,
  name,
  price,
  image_url,
  spec,
  href,
  showSpec = true,
  showFavorite = true,
  showAddToCart = true,
  compact = false,
  className,
}: DesktopProductCardProps) {
  const { addItem } = useCart();
  const path = href ?? productPath(id);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white",
        className
      )}
    >
      <Link
        href={path}
        className={cn("relative aspect-square overflow-hidden", compact ? "bg-white" : "bg-[#EEF8FC]")}
      >
        {image_url ? (
          compact ? (
            <span className="absolute inset-[10%]">
              <Image
                src={image_url}
                alt={name}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                sizes="(min-width:1024px) 200px, 40vw"
              />
            </span>
          ) : (
            <Image
              src={image_url}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width:1440px) 20vw, (min-width:1024px) 25vw, 40vw"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#687386]">
            無圖片
          </div>
        )}
        {showFavorite ? (
          <span
            className="absolute right-2 top-2 z-10"
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton
              targetType="product"
              targetId={id}
              size="sm"
              className="text-[#F16458]"
            />
          </span>
        ) : null}
      </Link>
      <div className={cn("flex flex-1 flex-col gap-1", compact ? "p-2.5 md:p-3" : "p-3")}>
        {/* Fixed two-line name and one-line spec keep cards in a row the same height. */}
        <Link
          href={path}
          className={cn(
            "line-clamp-2 min-h-[2.5em] font-semibold leading-[1.25] text-[#153E73]",
            compact ? "text-[13px] md:text-sm lg:text-[15px]" : "text-sm"
          )}
        >
          {name}
        </Link>
        {showSpec ? (
          <p className="line-clamp-1 min-h-[1.25em] text-xs leading-[1.25] text-[#687386]">{spec ?? ""}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className={cn("font-bold text-[#F16458]", compact ? "text-[15px] md:text-base" : "text-base")}>
            {formatCurrency(price)}
          </p>
          {showAddToCart ? (
            <button
              type="button"
              aria-label={`加入購物車：${name}`}
              onClick={() =>
                void addItem({
                  productId: id,
                  name,
                  price,
                  imageUrl: image_url,
                })
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFD454] text-[#153E73] transition hover:brightness-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.2} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
