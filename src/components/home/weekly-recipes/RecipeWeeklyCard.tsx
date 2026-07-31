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
  activeIndex: number
): CSSProperties {
  const distance = index - activeIndex;
  const absoluteDistance = Math.abs(distance);

  if (distance === 0) {
    return {
      transform: "translateY(0) scale(1) rotateY(0deg) rotateZ(0deg)",
      opacity: 1,
      zIndex: 20,
      filter: "none",
    };
  }

  if (absoluteDistance === 1) {
    const isPrevious = distance === -1;
    return {
      transform: isPrevious
        ? "translateY(34px) scale(0.80) rotateY(8deg) rotateZ(-2deg)"
        : "translateY(34px) scale(0.80) rotateY(-8deg) rotateZ(2deg)",
      opacity: 0.6,
      zIndex: 8,
      filter: "none",
    };
  }

  return {
    transform: "translateY(48px) scale(0.72)",
    opacity: 0.32,
    zIndex: 2,
    filter: "none",
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
        "recipe-weekly-card recipe-coverflow-card recipe-card relative flex shrink-0 snap-center snap-always flex-col",
        isActive && "recipe-coverflow-card--active"
      )}
      style={style}
      data-active={isActive ? "true" : "false"}
      data-state={state}
      aria-current={isActive ? "true" : undefined}
      aria-label={`第 ${index + 1} 張，共 ${total} 張：${recipe.title}`}
      onClick={handleCardClick}
    >
      <div className="recipe-card-inner flex h-auto min-h-0 w-full max-w-full flex-col overflow-hidden rounded-[20px] border border-[#E9EDF2] bg-white">
        <div className="recipe-card-image relative aspect-[4/3] w-full shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            draggable={false}
          />
          <span className="recipe-card-badge absolute left-[14px] top-[14px] bg-[#123B73] text-white">
            {recipe.time}
          </span>
          <span
            className="recipe-card-badge absolute right-[14px] top-[14px] text-[#123B73]"
            style={{ background: "rgba(135, 201, 232, 0.35)" }}
          >
            {recipe.difficulty}
          </span>
        </div>

        <div className="recipe-card-content flex h-auto min-h-0 flex-col overflow-visible px-4 pb-[17px] pt-[15px]">
          <h3 className="recipe-card-title m-0 line-clamp-2 font-extrabold text-[#123B73]">
            {recipe.title}
          </h3>

          <p
            className={cn(
              "mt-2 truncate text-sm leading-[1.45] text-[#687386] transition-opacity",
              !isActive && "pointer-events-none opacity-0"
            )}
          >
            {recipe.description}
          </p>

          <div
            className={cn(
              "recipe-card-actions mt-[15px] grid grid-cols-[50px_minmax(0,1fr)] items-center gap-3 transition-opacity",
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
              className="favorite-button inline-flex h-[50px] w-[50px] items-center justify-center rounded-full border border-[#E9EDF2] bg-white text-[#F15B52] transition hover:scale-105"
            >
              <Heart
                className="h-5 w-5"
                strokeWidth={2}
                fill={favorited ? "#F15B52" : "none"}
                color="#F15B52"
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
              className="recipe-view-button relative inline-flex h-[50px] items-center justify-center rounded-full bg-[#123B73] pr-12 text-[15px] font-bold text-white transition hover:bg-[#0e2f5c]"
            >
              查看食譜
              <span className="recipe-view-button-arrow absolute right-[7px] inline-flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#FFD34E] text-[#123B73]">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
