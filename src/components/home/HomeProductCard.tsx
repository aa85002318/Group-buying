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
        "flex h-full flex-col overflow-hidden rounded-[20px] border bg-card shadow-card transition duration-250 ease-brand hover:-translate-y-1 hover:shadow-lift",
        variant === "closing" ? "border-2 border-error" : "border-border"
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition duration-400 hover:scale-105"
              sizes="(max-width: 640px) 72vw, 25vw"
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
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-black text-price">{formatCurrency(product.price)}</span>
          {saving > 0 && (
            <>
              <span className="text-xs text-foreground-secondary line-through">
                {formatCurrency(product.original_price!)}
              </span>
              <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-black text-price">
                現省 {formatCurrency(saving)}
              </span>
            </>
          )}
        </div>

        <div className="mt-auto pt-3">
          {variant === "closing" ? (
            <Link
              href={href}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-error px-3 text-sm font-black text-white shadow-brand transition hover:opacity-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            >
              結團前搶購
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              disabled={adding}
              className="btn-brand w-full gap-2 disabled:opacity-60"
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
