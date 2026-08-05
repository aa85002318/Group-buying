import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  MOCK_RECIPE_CATEGORIES,
  MOCK_RECIPE_INGREDIENTS,
  MOCK_RECIPES_DB,
} from "@/lib/mock/recipes";
import type { RecipeSummary } from "@/lib/consumer-hub";
import type { Recipe } from "@/lib/types/database";
import { canViewRecipeByAccess, isPublicListableAccess } from "@/lib/recipes/access";

function toSummary(r: Recipe): RecipeSummary {
  const minutes = r.total_time ?? (r.prep_time ?? 0) + (r.cook_time ?? 0);
  return {
    id: r.id,
    title: r.title,
    coverImage: r.cover_image,
    difficulty: r.difficulty,
    durationMinutes: minutes,
    category: r.recipe_categories?.name ?? "食譜",
    hasVideo: Boolean(r.related_video_id),
    href: `/recipes/${r.slug}`,
  };
}

function recipeSearchText(recipe: Recipe) {
  const ingredients = (recipe.recipe_ingredients ?? [])
    .map((ingredient) => ingredient.name)
    .join(" ");
  return [recipe.title, recipe.summary ?? "", recipe.content ?? "", ingredients]
    .join(" ")
    .toLowerCase();
}

function toListItem(r: Recipe) {
  const ingredientNames = (r.recipe_ingredients ?? []).map((ingredient) => ingredient.name);
  return {
    ...toSummary(r),
    slug: r.slug,
    cover_image: r.cover_image,
    summary: r.summary,
    published_at: r.published_at,
    is_featured: r.is_featured,
    difficulty: r.difficulty,
    total_time: r.total_time,
    prep_time: r.prep_time,
    cook_time: r.cook_time,
    recipe_categories: r.recipe_categories ?? null,
    ingredient_names: ingredientNames,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const difficulty = searchParams.get("difficulty");
  const featured = searchParams.get("featured");

  if (!isSupabaseConfigured()) {
    let list = [...MOCK_RECIPES_DB].map((recipe) => ({
      ...recipe,
      recipe_ingredients: MOCK_RECIPE_INGREDIENTS.filter((ingredient) => ingredient.recipe_id === recipe.id),
    }));
    if (category && category !== "all") {
      list = list.filter((r) => r.recipe_categories?.slug === category);
    }
    if (difficulty) list = list.filter((r) => r.difficulty === difficulty);
    if (featured === "1") list = list.filter((r) => r.is_featured);
    if (q) {
      list = list.filter((r) => recipeSearchText(r).includes(q));
    }
    return NextResponse.json({
      recipes: list.map(toListItem),
      categories: MOCK_RECIPE_CATEGORIES,
    });
  }

  const supabase = await createClient();
  let query = supabase
    .from("recipes")
    .select("*, recipe_categories(id, name, slug), recipe_ingredients(name)")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (featured === "1") query = query.eq("is_featured", true);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recipes = (data ?? []) as Recipe[];
  recipes = recipes.filter((r) => {
    const access = r.access_permission ?? "public";
    if (isPublicListableAccess(access)) return true;
    return canViewRecipeByAccess(access, Boolean(user));
  });
  if (category && category !== "all") {
    recipes = recipes.filter((r) => r.recipe_categories?.slug === category);
  }
  if (q) {
    recipes = recipes.filter((r) => recipeSearchText(r).includes(q));
  }

  const { data: categories } = await supabase
    .from("recipe_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return NextResponse.json({
    recipes: recipes.map(toListItem),
    categories: categories ?? [],
  });
}
