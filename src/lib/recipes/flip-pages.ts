import type {
  Recipe,
  RecipeFaq,
  RecipeIngredient,
  RecipeMedia,
  RecipePreparation,
  RecipeProductRecommendation,
  RecipeStep,
  RecipeTool,
} from "@/lib/types/database";

export type FlipPageKind =
  | "cover"
  | "intro"
  | "scale"
  | "ingredients"
  | "tools"
  | "preparations"
  | "step"
  | "finish"
  | "storage"
  | "recommendations"
  | "faq"
  | "discussion"
  | "submissions"
  | "related";

export type FlipPage = {
  id: string;
  kind: FlipPageKind;
  title: string;
  step?: RecipeStep;
  stepIndex?: number;
  stepTotal?: number;
};

export type RelatedRecipeCard = {
  id: string;
  title: string;
  slug: string;
  cover_image?: string | null;
};

export type SmartRecipePayload = {
  recipe: Recipe;
  tools: RecipeTool[];
  preparations: RecipePreparation[];
  media: RecipeMedia[];
  faq: RecipeFaq[];
  recommendations: RecipeProductRecommendation[];
  related: RelatedRecipeCard[];
  discussionCount: number;
  submissionCount: number;
};

export function buildFlipPages(data: SmartRecipePayload): FlipPage[] {
  const { recipe, tools, preparations, faq, recommendations, related } = data;
  const steps = [...(recipe.recipe_steps ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.step_number - b.step_number
  );
  const ingredients = recipe.recipe_ingredients ?? [];
  const pages: FlipPage[] = [];

  pages.push({ id: "cover", kind: "cover", title: "封面" });

  if (recipe.summary?.trim() || recipe.content?.trim()) {
    pages.push({ id: "intro", kind: "intro", title: "成品介紹" });
  }

  if (recipe.ingredient_scaling_enabled !== false && ingredients.length > 0) {
    pages.push({ id: "scale", kind: "scale", title: "配方倍率與份量" });
  }

  if (ingredients.length > 0) {
    pages.push({ id: "ingredients", kind: "ingredients", title: "材料" });
  }

  if (tools.length > 0) {
    pages.push({ id: "tools", kind: "tools", title: "器具" });
  }

  if (preparations.length > 0) {
    pages.push({ id: "preparations", kind: "preparations", title: "前置作業" });
  }

  steps.forEach((step, index) => {
    pages.push({
      id: `step-${step.id}`,
      kind: "step",
      title: step.title?.trim() || `步驟 ${step.step_number}`,
      step,
      stepIndex: index + 1,
      stepTotal: steps.length,
    });
  });

  pages.push({ id: "finish", kind: "finish", title: "完成" });

  if (recipe.storage_method?.trim()) {
    pages.push({ id: "storage", kind: "storage", title: "保存方式" });
  }

  const hasRecs =
    recommendations.length > 0 ||
    ingredients.some((i) => i.product_id && i.products?.is_active !== false);
  if (recipe.product_recommendation_enabled !== false && hasRecs) {
    pages.push({ id: "recommendations", kind: "recommendations", title: "AI 商品推薦" });
  }

  if (faq.length > 0) {
    pages.push({ id: "faq", kind: "faq", title: "常見問題" });
  }

  if (recipe.discussion_enabled !== false) {
    pages.push({ id: "discussion", kind: "discussion", title: "問題討論" });
  }

  if (recipe.submission_enabled !== false) {
    pages.push({ id: "submissions", kind: "submissions", title: "成品分享" });
  }

  if (related.length > 0) {
    pages.push({ id: "related", kind: "related", title: "相關食譜" });
  }

  return pages;
}

export function difficultyLabel(value: string): string {
  if (value === "easy") return "初學";
  if (value === "medium") return "進階";
  if (value === "hard") return "挑戰";
  return value;
}

export function ingredientKey(ing: RecipeIngredient): string {
  return ing.id;
}
