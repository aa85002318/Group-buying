"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { HomeCountdown } from "@/components/home/HomeCountdown";
import { useCart } from "@/hooks/useCart";
import type { HomeProduct } from "@/lib/home";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type HomeProductCardVariant = "new" | "closing" | "ranking";

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
      <article className="relative overflow-hidden rounded-[20px] border border-[#ECECEC] bg-white p-3 shadow-card">
        <span
          className={cn(
            "absolute left-2 top-2 z-10 inline-flex h-8 min-w-14 items-center justify-center rounded-full px-2 text-xs font-black text-white shadow-md",
            rank === 1
              ? "bg-gradient-to-r from-[#FF7A00] to-[#FFC83D]"
              : rank === 2
                ? "bg-gradient-to-r from-[#64748B] to-[#94A3B8]"
                : "bg-gradient-to-r from-[#B45309] to-[#D97706]"
          )}
        >
          TOP {rank}
        </span>
        <Link href={href} className="grid grid-cols-[92px_1fr] gap-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F7F7F8]">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="92px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[#737373]">
                暫無圖片
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h3 className="line-clamp-2 text-sm font-bold text-[#222222]">{product.name}</h3>
            <p className="mt-2 text-lg font-black text-[#E92D2D]">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#737373]">
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
        "flex h-full flex-col overflow-hidden rounded-[20px] border bg-white shadow-card",
        variant === "closing" ? "border-[#FFB4A2]" : "border-[#ECECEC]"
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#F7F7F8]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 640px) 72vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#737373]">
              暫無圖片
            </div>
          )}

          {variant === "new" && (
            <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#F43F5E] px-2.5 py-1 text-[11px] font-black text-white shadow-md">
              NEW
            </span>
          )}
          {variant === "closing" && product.cutoff_at && (
            <div className="absolute left-2 top-2">
              <HomeCountdown endAt={product.cutoff_at} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#222222]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-black text-[#E92D2D]">{formatCurrency(product.price)}</span>
          {saving > 0 && (
            <>
              <span className="text-xs text-[#737373] line-through">
                {formatCurrency(product.original_price!)}
              </span>
              <span className="rounded-full bg-[#FFF1F3] px-2 py-0.5 text-[10px] font-black text-[#E92D2D]">
                現省 {formatCurrency(saving)}
              </span>
            </>
          )}
        </div>

        <div className="mt-auto pt-3">
          {variant === "new" ? (
            <button
              type="button"
              onClick={addToCart}
              disabled={adding}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#E92D2D] px-3 text-sm font-black text-white shadow-sm transition hover:bg-[#C81E1E] active:scale-[0.98] disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {adding ? "加入中…" : "加入購物車"}
            </button>
          ) : (
            <Link
              href={href}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#E92D2D] to-[#FF7A00] px-3 text-sm font-black text-white shadow-md transition active:scale-[0.98]"
            >
              結團前搶購
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {message && (
            <p className="mt-1.5 text-center text-[11px] font-medium text-[#737373]" role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
