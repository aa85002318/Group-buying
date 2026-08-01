"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { HomeCountdown } from "@/components/home/HomeCountdown";
import { ProductSticker } from "@/components/brand/ProductSticker";
import { useCart } from "@/hooks/useCart";
import type { HomeProduct } from "@/lib/home";
import { formatCurrency, cn } from "@/lib/utils";

export type HomeProductCardVariant = "new" | "closing" | "ranking" | "hot" | "recommend";

interface HomeProductCardProps {
  product: HomeProduct;
  variant: HomeProductCardVariant;
  rank?: number;
}

export function HomeProductCard({ product, variant, rank }: HomeProductCardProps) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const href = product.href ?? `/products/${product.id}`;
  const saving =
    product.original_price && product.original_price > product.price
      ? product.original_price - product.price
      : 0;

  const addToCart = async () => {
    setAdding(true);
    setMessage(null);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
      });
      setMessage("已加入購物車");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加入失敗");
    } finally {
      setAdding(false);
    }
  };

  if (variant === "ranking") {
    return (
      <article className="card-lift relative overflow-hidden p-3">
        <span
          className={cn(
            "absolute left-2 top-2 z-10 inline-flex h-8 min-w-14 items-center justify-center rounded-full px-2 text-xs font-black shadow-sticker",
            rank === 1
              ? "bg-primary text-white"
              : rank === 2
                ? "bg-groupBuy text-white"
                : "bg-warning text-foreground"
          )}
        >
          TOP {rank}
        </span>
        <Link href={href} className="grid grid-cols-[92px_1fr] gap-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover transition duration-400 hover:scale-105"
                sizes="92px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-foreground-secondary">
                暫無圖片
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h3 className="line-clamp-2 text-sm font-bold text-foreground">{product.name}</h3>
            <p className="mt-2 text-lg font-black text-price">{formatCurrency(product.price)}</p>
            <p className="mt-1 text-xs font-semibold text-foreground-secondary">
              已售 {product.sold_count ?? 0} 件
            </p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "flex h-[280px] flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_5px_16px_rgba(21,62,115,0.05)] transition duration-300 md:h-[320px] md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)]",
        variant === "closing" ? "border-[#F16458]" : "border-[#E9EDF2]"
      )}
    >
      <Link href={href} className="relative block h-[135px] shrink-0 overflow-hidden bg-[#F4F6F8] md:h-[165px] xl:h-[170px]" aria-label={product.name}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 767px) 176px, (max-width: 1279px) 210px, 220px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-foreground-secondary">
            暫無圖片
          </div>
        )}

        {variant === "new" && <ProductSticker type="new" />}
        {variant === "hot" && <ProductSticker type="hot" />}
        {variant === "recommend" && <ProductSticker type="limited" />}
        {variant === "closing" && product.cutoff_at && (
          <div className="absolute left-2 top-2 z-10">
            <HomeCountdown endAt={product.cutoff_at} />
          </div>
        )}
      </Link>

      <div className="flex min-h-0 flex-1 flex-col bg-white px-2.5 pb-2.5 pt-2 md:px-3 md:pb-3">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
            {formatCurrency(product.price)}
          </span>
          {saving > 0 && (
            <span className="text-[11px] text-[#687386] line-through md:text-xs">
              {formatCurrency(product.original_price!)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          {variant === "closing" ? (
            <Link
              href={href}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#F16458] px-3 text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.98] md:h-10"
            >
              結團前搶購
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              disabled={adding}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#FFD454] text-sm font-bold text-[#153E73] transition hover:brightness-95 disabled:opacity-60 md:h-10"
            >
              <ShoppingCart className="h-4 w-4" />
              {adding ? "加入中…" : "加入購物車"}
            </button>
          )}
          {message && (
            <p className="mt-1.5 text-center text-[11px] font-medium text-foreground-secondary" role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
