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
      <Link href={path} className="relative aspect-square overflow-hidden bg-[#F7F2EA]">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(min-width:1440px) 20vw, (min-width:1024px) 25vw, 40vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#9A7B6C]">
            無圖片
          </div>
        )}
        {showFavorite ? (
          <span
            className="absolute right-2 top-2 z-10"
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton targetType="product" targetId={id} size="sm" />
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={path} className="line-clamp-2 text-sm font-semibold text-[#153E73]">
          {name}
        </Link>
        {showSpec && spec ? (
          <p className="line-clamp-1 text-xs text-[#9A7B6C]">{spec}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="text-base font-bold text-[#E85A4F]">{formatCurrency(price)}</p>
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FEE169] text-[#153E73] transition hover:brightness-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.2} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
