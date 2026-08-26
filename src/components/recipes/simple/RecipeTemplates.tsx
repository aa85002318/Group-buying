"use client";

import { RecipeBreadcrumb } from "@/components/recipes/simple/RecipeBreadcrumb";
import { RecipeCover } from "@/components/recipes/simple/RecipeCover";
import { RecipeIngredients } from "@/components/recipes/simple/RecipeIngredients";
import { RecipeMeta } from "@/components/recipes/simple/RecipeMeta";
import { RecipeSteps } from "@/components/recipes/simple/RecipeSteps";
import { RecipeTips } from "@/components/recipes/simple/RecipeTips";
import { RecipeVideo } from "@/components/recipes/simple/RecipeVideo";
import { RelatedProducts } from "@/components/recipes/simple/RelatedProducts";
import { RelatedRecipes } from "@/components/recipes/simple/RelatedRecipes";
import {
  recipeHasVideo,
  resolveRecipePrimaryVideoUrl,
} from "@/lib/recipes/recipe-type";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import type { RecipeProductRecommendation } from "@/lib/types/database";

type Props = {
  data: SmartRecipePayload;
  recommendations?: RecipeProductRecommendation[];
};

function shell(children: React.ReactNode, maxWidthClass: string) {
  return (
    <div className="min-h-[100dvh] bg-[#FFFEFA] text-[#153E73]">
      <div className={`mx-auto px-5 py-8 md:px-8 ${maxWidthClass}`}>{children}</div>
    </div>
  );
}

export function VideoRecipeTemplate({ data, recommendations = [] }: Props) {
  const { recipe, related } = data;
  const videoUrl = resolveRecipePrimaryVideoUrl(recipe);
  return shell(
    <>
      <RecipeBreadcrumb categoryName={recipe.recipe_categories?.name} title={recipe.title} />
      <h1 className="text-3xl font-bold tracking-tight text-[#153E73] md:text-4xl">{recipe.title}</h1>
      {recipe.summary ? <p className="mt-3 text-base text-[#8A94A6]">{recipe.summary}</p> : null}
      <RecipeMeta
        prepTime={recipe.prep_time}
        cookTime={recipe.cook_time}
        totalTime={recipe.total_time}
        servings={recipe.servings}
        difficulty={recipe.difficulty}
      />
      <div className="mt-8">
        <RecipeVideo url={videoUrl} />
      </div>
      <RecipeIngredients ingredients={recipe.recipe_ingredients ?? []} />
      <RecipeTips tips={recipe.tips} />
      <RelatedProducts recommendations={recommendations} />
      <RelatedRecipes recipes={related} />
    </>,
    "max-w-[1100px]"
  );
}

export function ArticleRecipeTemplate({ data, recommendations = [] }: Props) {
  const { recipe, related } = data;
  const videoUrl = recipeHasVideo(recipe) ? resolveRecipePrimaryVideoUrl(recipe) : null;
  return shell(
    <>
      <RecipeBreadcrumb categoryName={recipe.recipe_categories?.name} title={recipe.title} />
      <RecipeCover src={recipe.cover_image} alt={recipe.title} />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#153E73] md:text-4xl">{recipe.title}</h1>
      {recipe.summary ? <p className="mt-3 text-base leading-relaxed text-[#8A94A6]">{recipe.summary}</p> : null}
      {recipe.content ? (
        <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-[#153E73]/90">{recipe.content}</p>
      ) : null}
      <RecipeMeta
        prepTime={recipe.prep_time}
        cookTime={recipe.cook_time}
        totalTime={recipe.total_time}
        servings={recipe.servings}
        difficulty={recipe.difficulty}
      />
      {videoUrl ? (
        <div className="mt-8">
          <RecipeVideo url={videoUrl} />
        </div>
      ) : null}
      <RecipeIngredients ingredients={recipe.recipe_ingredients ?? []} />
      <RecipeSteps steps={recipe.recipe_steps ?? []} />
      <RecipeTips tips={recipe.tips} />
      <RelatedProducts recommendations={recommendations} />
      <RelatedRecipes recipes={related} />
    </>,
    "max-w-[1000px]"
  );
}
