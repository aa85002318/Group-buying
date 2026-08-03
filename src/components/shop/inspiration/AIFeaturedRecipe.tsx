"use client";

import Link from "next/link";
import { ArrowRight, Clock, Star } from "lucide-react";
import {
  difficultyStars,
  type InspirationRecipe,
} from "@/lib/shop/inspiration-wall";
import { cn } from "@/lib/utils";

/**
 * Featured inspiration card — full-bleed banner media (no default IP logo).
 * Priority: inspiration_banner_url → cover_image_url.
 */
export function AIFeaturedRecipe({
  recipe,
  loading,
}: {
  recipe: InspirationRecipe | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div
        className="animate-pulse overflow-hidden rounded-[24px] bg-[#FFF9E8]"
        style={{ minHeight: 220 }}
        aria-hidden
      >
        <div className="aspect-[5/2] w-full bg-[#FFE9A8]" />
        <div className="space-y-3 p-5">
          <div className="h-5 w-28 rounded-full bg-[#FFE9A8]" />
          <div className="h-8 w-3/5 rounded bg-[#FFE9A8]" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  const mediaSrc =
    (recipe.inspiration_banner_url || "").trim() ||
    recipe.cover_image_url ||
    "";
  const minutes = recipe.duration_minutes;
  const rating = recipe.rating ?? 4.8;
  const ratingCount = recipe.rating_count;

  return (
    <article className="overflow-hidden rounded-[24px] bg-[#FFF9E8]">
      {mediaSrc ? (
        <Link href={recipe.href} className="relative block aspect-[5/2] w-full overflow-hidden bg-[#FFF3C4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaSrc}
            alt={recipe.title}
            className="h-full w-full object-cover object-center"
            loading="eager"
          />
        </Link>
      ) : null}

      <div className="flex min-w-0 flex-col justify-center p-5 md:p-6">
        <span className="inline-flex w-fit items-center rounded-full bg-[#FFD84D] px-3 py-1 text-[12px] font-bold text-[#153E73]">
          AI 今日推薦
        </span>
        <h3 className="mt-3 text-[22px] font-bold leading-snug text-[#153E73] md:text-[26px]">
          {recipe.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#153E73]/80">
          <span className="inline-flex items-center gap-1 font-semibold">
            <Star className="h-3.5 w-3.5 fill-[#F5A623] text-[#F5A623]" aria-hidden />
            {rating.toFixed(1)}
            {ratingCount != null ? (
              <span className="font-medium text-[#687386]">
                （{ratingCount.toLocaleString("zh-TW")}）
              </span>
            ) : null}
          </span>
          {minutes != null ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {minutes} 分鐘
            </span>
          ) : null}
          <span aria-label={`難度 ${recipe.difficulty ?? 2}`}>
            {difficultyStars(recipe.difficulty)}
          </span>
        </div>

        {recipe.description ? (
          <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-[#687386]">
            {recipe.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href={recipe.href}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-[#FFD84D] px-5 text-[15px] font-bold text-[#153E73] transition duration-200 hover:-translate-y-px md:w-[180px]"
            )}
          >
            立即製作
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {recipe.ingredient_product_ids && recipe.ingredient_product_ids.length > 0 ? (
            <Link
              href={`${recipe.href}?buy=ingredients`}
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#153E73]/15 bg-white px-5 text-[14px] font-bold text-[#153E73] transition duration-200 hover:-translate-y-px md:w-auto"
            >
              一鍵買齊材料
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
