"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoRecipe } from "@/lib/home/recipe-demo";

export type RecipeCardState = "active" | "previous" | "next" | "outer";

export function getCardState(index: number, activeIndex: number): RecipeCardState {
  const distance = index - activeIndex;
  const absoluteDistance = Math.abs(distance);
  if (distance === 0) return "active";
  if (distance === -1) return "previous";
  if (distance === 1) return "next";
  if (absoluteDistance >= 2) return "outer";
  return "outer";
}

export function getCoverflowStyle(
  index: number,
  activeIndex: number,
  compact = false
): CSSProperties {
  const distance = index - activeIndex;
  const abs = Math.abs(distance);

  const yOffset =
    distance === 0 ? 0 : Math.min(76, 42 + (abs - 1) * 24);

  const activeScale = compact ? 1.04 : 1.08;
  const scale =
    distance === 0 ? activeScale : Math.max(0.72, 0.84 - (abs - 1) * 0.08);

  const rotateY = distance === 0 ? 0 : distance < 0 ? 9 : -9;
  const rotateZ = distance === 0 ? 0 : distance < 0 ? -2 : 2;

  const opacity =
    distance === 0 ? 1 : Math.max(0.38, 0.74 - (abs - 1) * 0.18);

  return {
    ["--distance" as string]: distance,
    ["--abs-distance" as string]: abs,
    transform: `translateY(${yOffset}px) scale(${scale}) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
    opacity,
    zIndex: 20 - abs,
    filter:
      distance === 0
        ? "none"
        : abs === 1
          ? "saturate(0.85) brightness(0.96)"
          : "saturate(0.7) brightness(0.94)",
  };
}

type RecipeWeeklyCardProps = {
  recipe: DemoRecipe;
  index: number;
  total: number;
  state: RecipeCardState;
  style: CSSProperties;
  onActivate: (index: number) => void;
};

export function RecipeWeeklyCard({
  recipe,
  index,
  total,
  state,
  style,
  onActivate,
}: RecipeWeeklyCardProps) {
  const [favorited, setFavorited] = useState(false);
  const isActive = state === "active";

  const handleCardClick = (e: MouseEvent) => {
    if (!isActive) {
      e.preventDefault();
      onActivate(index);
    }
  };

  return (
    <article
      className={cn(
        "recipe-weekly-card recipe-coverflow-card relative flex shrink-0 snap-center snap-always flex-col overflow-hidden rounded-[20px] border border-[#E9EDF2] bg-white",
        isActive && "recipe-coverflow-card--active shadow-[0_22px_50px_rgba(18,59,115,0.20)]"
      )}
      style={style}
      data-active={isActive ? "true" : "false"}
      data-state={state}
      aria-current={isActive ? "true" : undefined}
      aria-label={`第 ${index + 1} 張，共 ${total} 張：${recipe.title}`}
      onClick={handleCardClick}
    >
      {isActive ? <div className="h-[5px] shrink-0 bg-[#FFD34E]" aria-hidden /> : null}

      <div className="relative aspect-[4/3] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.image}
          alt={recipe.title}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        <span className="absolute left-3 top-3 rounded-full bg-[#123B73] px-2.5 py-1 text-[11px] font-semibold text-white">
          {recipe.time}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#87C9E8] px-2.5 py-1 text-[11px] font-semibold text-[#123B73]">
          {recipe.difficulty}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3">
        <h3 className="line-clamp-2 font-extrabold leading-[1.3] text-[#123B73] text-[clamp(21px,6vw,27px)]">
          {recipe.title}
        </h3>

        <p
          className={cn(
            "card-description mt-1 truncate text-[15px] text-[#687386] transition-opacity",
            !isActive && "pointer-events-none opacity-0"
          )}
        >
          {recipe.description}
        </p>

        <div
          className={cn(
            "card-actions mt-[18px] grid grid-cols-[52px_1fr] items-center gap-3 transition-opacity",
            !isActive && "pointer-events-none opacity-0"
          )}
        >
          <button
            type="button"
            tabIndex={isActive ? 0 : -1}
            aria-label={favorited ? "取消收藏" : "加入收藏"}
            aria-hidden={!isActive}
            onClick={(e) => {
              e.stopPropagation();
              if (!isActive) return;
              setFavorited((v) => !v);
            }}
            className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#E9EDF2] bg-white transition hover:scale-105"
          >
            <Heart
              className="h-5 w-5"
              strokeWidth={2}
              fill={favorited ? "#F15B52" : "none"}
              color={favorited ? "#F15B52" : "#123B73"}
            />
          </button>

          <Link
            href={`/recipes/${recipe.id}`}
            tabIndex={isActive ? 0 : -1}
            aria-hidden={!isActive}
            onClick={(e) => {
              if (!isActive) {
                e.preventDefault();
                onActivate(index);
              }
              e.stopPropagation();
            }}
            className="relative inline-flex h-[52px] items-center justify-center rounded-full bg-[#123B73] pr-12 text-[14px] font-semibold text-white transition hover:bg-[#0e2f5c]"
          >
            查看食譜
            <span className="absolute right-2 inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#FFD34E] text-[#123B73]">
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
