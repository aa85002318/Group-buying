"use client";

import Link from "next/link";
import { Clock, Heart, Star } from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import {
  difficultyStars,
  type InspirationRecipe,
} from "@/lib/shop/inspiration-wall";
import { cn } from "@/lib/utils";

function RecipeCard({ recipe }: { recipe: InspirationRecipe }) {
  const isDemo = recipe.id.startsWith("demo-");

  return (
    <article
      className={cn(
        "shop-inspiration-recipe-card group relative w-[158px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,62,115,0.08)] transition duration-200 hover:-translate-y-0.5 sm:w-[165px] md:w-[calc((100%-48px)/4)] md:max-w-[260px] md:shrink"
      )}
    >
      <Link href={recipe.href} className="block">
        <div className="relative p-2 pb-0">
          <div className="aspect-[4/3] overflow-hidden rounded-[14px] bg-[#FFF8D6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.cover_image_url}
              alt={recipe.title}
              className="aspect-[4/3] h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          {!isDemo ? (
            <div className="absolute right-3 top-3 z-10">
              <FavoriteButton
                targetType="recipe"
                targetId={recipe.id}
                size="sm"
                className="!h-8 !w-8 bg-white/90 text-[#F0645A] shadow-sm backdrop-blur"
              />
            </div>
          ) : (
            <span className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#F0645A] shadow-sm">
              <Heart className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-3 pt-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#153E73]">
            {recipe.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#687386]">
            {recipe.rating != null ? (
              <span className="inline-flex items-center gap-0.5 font-medium text-[#153E73]">
                <Star className="h-3 w-3 fill-[#F5A623] text-[#F5A623]" aria-hidden />
                {recipe.rating.toFixed(1)}
              </span>
            ) : null}
            {recipe.favorite_count != null && recipe.favorite_count > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <Heart className="h-3 w-3 text-[#F0645A]" aria-hidden />
                {recipe.favorite_count}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#687386]">
            {recipe.duration_minutes != null ? (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-3 w-3" aria-hidden />
                {recipe.duration_minutes} 分
              </span>
            ) : null}
            <span className="tracking-tight">{difficultyStars(recipe.difficulty)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function InspirationRecipeCarousel({
  recipes,
  loading,
}: {
  recipes: InspirationRecipe[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden md:gap-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[220px] w-[158px] shrink-0 animate-pulse rounded-2xl bg-[#FFF3C4]/70 md:w-[calc((100%-48px)/4)]"
          />
        ))}
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <div className="rounded-[20px] bg-white px-5 py-8 text-center shadow-[0_8px_24px_rgba(21,62,115,0.06)]">
        <p className="text-[14px] leading-relaxed text-[#687386]">
          目前還沒有靈感內容，
          <br />
          先去看看最新食譜吧！
        </p>
        <Link
          href="/recipes"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#FFD84D] px-5 text-[14px] font-bold text-[#153E73]"
        >
          探索食譜
        </Link>
      </div>
    );
  }

  return (
    <div className="shop-inspiration-recipe-rail flex gap-3 overflow-x-auto pb-1 md:gap-4 md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
