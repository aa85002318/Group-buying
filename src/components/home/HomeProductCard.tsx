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
      <article className="relative overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white p-3 shadow-card">
        <span
          className={cn(
            "absolute left-2 top-2 z-10 inline-flex h-8 min-w-14 items-center justify-center rounded-full px-2 text-xs font-black shadow-md",
            rank === 1
              ? "bg-[#FF4D36] text-white"
              : rank === 2
                ? "bg-[#FF8300] text-white"
                : "bg-[#FFC400] text-[#202124]"
          )}
        >
          TOP {rank}
        </span>
        <Link href={href} className="grid grid-cols-[92px_1fr] gap-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F7F7F9]">
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
              <div className="flex h-full items-center justify-center text-xs text-[#6B7280]">
                暫無圖片
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h3 className="line-clamp-2 text-sm font-bold text-[#202124]">{product.name}</h3>
            <p className="mt-2 text-lg font-black text-[#E9285C]">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#6B7280]">
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
        variant === "closing" ? "border-2 border-[#FF4D36]" : "border-[#E5E7EB]"
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#F7F7F9]">
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
            <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">
              暫無圖片
            </div>
          )}

          {variant === "new" && (
            <span className="absolute left-2 top-2 rounded-full bg-[#A93DDB] px-2.5 py-1 text-[11px] font-black text-white shadow-md">
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
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#202124]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-black text-[#E9285C]">{formatCurrency(product.price)}</span>
          {saving > 0 && (
            <>
              <span className="text-xs text-[#6B7280] line-through">
                {formatCurrency(product.original_price!)}
              </span>
              <span className="rounded-full bg-[#FFF0F4] px-2 py-0.5 text-[10px] font-black text-[#E9285C]">
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
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#E9285C] px-3 text-sm font-black text-white shadow-[0_7px_16px_rgba(233,40,92,0.25)] transition hover:bg-[#B81648] active:scale-[0.98] disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {adding ? "加入中…" : "加入購物車"}
            </button>
          ) : (
            <Link
              href={href}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#FF4D36] px-3 text-sm font-black text-white shadow-[0_7px_16px_rgba(255,77,54,0.28)] transition hover:bg-[#E83924] active:scale-[0.98]"
            >
              結團前搶購
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {message && (
            <p className="mt-1.5 text-center text-[11px] font-medium text-[#6B7280]" role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
