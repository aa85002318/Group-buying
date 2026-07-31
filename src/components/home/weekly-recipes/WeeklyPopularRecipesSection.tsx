"use client";

import { useMemo } from "react";
import type { RecipeSummary } from "@/lib/consumer-hub";
import type { DemoRecipe } from "@/lib/home/recipe-demo";
import { demoRecipes } from "@/lib/home/recipe-demo";
import { RecipeWeeklyCarousel } from "./RecipeWeeklyCarousel";
import {
  RECIPE_WEEKLY_TITLE,
  RECIPE_WEEKLY_TITLE_ID,
  RecipeWeeklyTitle,
} from "./RecipeWeeklyTitle";

function toDemoRecipes(
  recipes: RecipeSummary[],
  manualIds: string[],
  sourceMode: "auto" | "manual",
  limit: number
): DemoRecipe[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  let picked: RecipeSummary[] = [];
  if (sourceMode === "manual" && manualIds.length > 0) {
    picked = manualIds.map((id) => byId.get(id)).filter(Boolean) as RecipeSummary[];
  } else {
    picked = recipes.slice(0, limit);
  }
  if (!picked.length) return demoRecipes.slice(0, limit);
  return picked.slice(0, limit).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.category || "精選食譜",
    time: r.durationMinutes ? `${r.durationMinutes} 分鐘` : "—",
    difficulty:
      r.difficulty === "easy" ? "初級" : r.difficulty === "hard" ? "高級" : "中級",
    image: r.coverImage || demoRecipes[0].image,
  }));
}

/** 精選食譜 — CMS-driven when recipes/manualIds provided. */
export function WeeklyPopularRecipesSection({
  title,
  recipes = [],
  manualIds = [],
  sourceMode = "auto",
  limit = 8,
  loading = false,
}: {
  title?: string;
  recipes?: RecipeSummary[];
  manualIds?: string[];
  sourceMode?: "auto" | "manual";
  limit?: number;
  loading?: boolean;
}) {
  const cards = useMemo(
    () => toDemoRecipes(recipes, manualIds, sourceMode, limit),
    [recipes, manualIds, sourceMode, limit]
  );

  return (
    <section
      className="featured-recipes-section recipe-weekly box-border w-full max-w-full overflow-x-clip bg-white"
      aria-labelledby={RECIPE_WEEKLY_TITLE_ID}
      aria-label={title || RECIPE_WEEKLY_TITLE}
    >
      <div className="mx-auto w-full max-w-full bg-white lg:max-w-[1100px]">
        <RecipeWeeklyTitle title={title} />
        {loading && !cards.length ? (
          <div className="home-skeleton mx-4 h-[280px] rounded-2xl" />
        ) : (
          <RecipeWeeklyCarousel recipes={cards} />
        )}
      </div>
    </section>
  );
}
