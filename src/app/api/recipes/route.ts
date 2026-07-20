import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { MOCK_RECIPE_CATEGORIES, MOCK_RECIPES_DB } from "@/lib/mock/recipes";
import type { RecipeSummary } from "@/lib/consumer-hub";
import type { Recipe } from "@/lib/types/database";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const difficulty = searchParams.get("difficulty");
  const featured = searchParams.get("featured");

  if (!isSupabaseConfigured()) {
    let list = [...MOCK_RECIPES_DB];
    if (category && category !== "all") {
      list = list.filter((r) => r.recipe_categories?.slug === category);
    }
    if (difficulty) list = list.filter((r) => r.difficulty === difficulty);
    if (featured === "1") list = list.filter((r) => r.is_featured);
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.summary ?? "").toLowerCase().includes(q) ||
          (r.content ?? "").toLowerCase().includes(q)
      );
    }
    return NextResponse.json({
      recipes: list.map(toSummary),
      categories: MOCK_RECIPE_CATEGORIES,
    });
  }

  const supabase = await createClient();
  let query = supabase
    .from("recipes")
    .select("*, recipe_categories(id, name, slug)")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (featured === "1") query = query.eq("is_featured", true);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let recipes = (data ?? []) as Recipe[];
  if (category && category !== "all") {
    recipes = recipes.filter((r) => r.recipe_categories?.slug === category);
  }
  if (q) {
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.summary ?? "").toLowerCase().includes(q) ||
        (r.content ?? "").toLowerCase().includes(q)
    );
  }

  const { data: categories } = await supabase
    .from("recipe_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return NextResponse.json({
    recipes: recipes.map(toSummary),
    categories: categories ?? [],
  });
}
