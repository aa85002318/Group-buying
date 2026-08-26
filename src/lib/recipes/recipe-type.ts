import type { Recipe, RecipeMedia, RecipeStep } from "@/lib/types/database";

export type RecipeContentType = "video" | "article";

type RecipeLike = Pick<
  Recipe,
  "recipe_type" | "youtube_url" | "video_url" | "related_video_id"
> & {
  recipe_steps?: Pick<RecipeStep, "id" | "video_url">[] | null;
  recipe_media?: Pick<RecipeMedia, "media_type" | "url">[] | null;
  videos?: { video_url?: string | null } | null;
};

export function recipeHasVideo(recipe: RecipeLike): boolean {
  if (recipe.youtube_url?.trim()) return true;
  if (recipe.video_url?.trim()) return true;
  if (recipe.related_video_id) return true;
  if (recipe.videos?.video_url?.trim()) return true;
  if ((recipe.recipe_media ?? []).some((m) => m.media_type === "video" && m.url)) {
    return true;
  }
  if ((recipe.recipe_steps ?? []).some((s) => Boolean(s.video_url?.trim()))) return true;
  return false;
}

export function recipeHasSteps(recipe: RecipeLike): boolean {
  return (recipe.recipe_steps ?? []).length > 0;
}

/**
 * Backward-compatible resolver.
 * - Explicit recipe_type wins.
 * - null + video only → video
 * - null + steps (or both) → article (video still shown when present)
 * - empty → article
 */
export function resolveRecipeType(recipe: RecipeLike): RecipeContentType {
  if (recipe.recipe_type === "video" || recipe.recipe_type === "article") {
    return recipe.recipe_type;
  }
  const hasVideo = recipeHasVideo(recipe);
  const hasSteps = recipeHasSteps(recipe);
  if (hasVideo && !hasSteps) return "video";
  if (hasSteps) return "article";
  if (hasVideo) return "video";
  return "article";
}

export function resolveRecipePrimaryVideoUrl(recipe: RecipeLike): string | null {
  if (recipe.youtube_url?.trim()) return recipe.youtube_url.trim();
  if (recipe.video_url?.trim()) return recipe.video_url.trim();
  if (recipe.videos?.video_url?.trim()) return recipe.videos.video_url.trim();
  const mediaVideo = (recipe.recipe_media ?? []).find(
    (m) => m.media_type === "video" && m.url
  );
  if (mediaVideo?.url) return mediaVideo.url;
  const stepVideo = (recipe.recipe_steps ?? []).find((s) => s.video_url?.trim());
  return stepVideo?.video_url?.trim() || null;
}

export const DIFFICULTY_LABELS: Record<"easy" | "medium" | "hard", string> = {
  easy: "簡單",
  medium: "中等",
  hard: "進階",
};
