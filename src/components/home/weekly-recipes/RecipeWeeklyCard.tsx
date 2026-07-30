"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { DemoRecipe } from "@/lib/home/recipe-demo";

export function RecipeWeeklyCard({ recipe }: { recipe: DemoRecipe }) {
  const [favorited, setFavorited] = useState(false);

  return (
    <article className="recipe-weekly-card group flex h-[440px] w-[280px] shrink-0 snap-center flex-col overflow-hidden rounded-[20px] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(21,62,115,0.12)] md:w-[320px] lg:w-[340px]">
      <div className="relative h-[220px] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.image}
          alt={recipe.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-[#153E73] px-2.5 py-1 text-[11px] font-semibold text-white">
          {recipe.time}
        </span>
        <span className="absolute right-3 top-3 rounded-full border border-[#E9EDF2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#153E73]">
          {recipe.difficulty}
        </span>
        <button
          type="button"
          aria-label={favorited ? "取消收藏" : "加入收藏"}
          onClick={() => setFavorited((v) => !v)}
          className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105"
        >
          <Heart
            className="h-[18px] w-[18px]"
            strokeWidth={2}
            fill={favorited ? "#F16458" : "none"}
            color={favorited ? "#F16458" : "#153E73"}
          />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3">
        <h3 className="line-clamp-2 min-h-[48px] text-[17px] font-bold leading-snug text-[#153E73]">
          {recipe.title}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[40px] text-[13px] leading-relaxed text-[#687386]">
          {recipe.description}
        </p>
        <Link
          href={`/recipes/${recipe.id}`}
          className="mt-auto inline-flex h-[46px] w-full items-center justify-center rounded-full bg-[#153E73] text-[14px] font-semibold text-white transition hover:bg-[#0f2f57]"
        >
          查看食譜
        </Link>
      </div>
    </article>
  );
}
