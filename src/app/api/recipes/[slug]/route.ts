import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockRecipeBySlug, MOCK_RECIPES_DB } from "@/lib/mock/recipes";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    const recipe = getMockRecipeBySlug(slug);
    if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
    const related = MOCK_RECIPES_DB.filter(
      (r) => r.id !== recipe.id && r.category_id === recipe.category_id
    ).slice(0, 3);
    return NextResponse.json({ recipe, related_recipes: related });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "*, recipe_categories(id, name, slug), recipe_ingredients(*, products(id, name, price, image_url, is_active)), recipe_steps(*), videos:related_video_id(id, title, slug, thumbnail_url, video_url)"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "食譜不存在或尚未發布" }, { status: 404 });
  }

  const { data: related } = data.category_id
    ? await supabase
        .from("recipes")
        .select("id, title, slug, cover_image, difficulty, total_time, recipe_categories(name)")
        .eq("status", "published")
        .neq("id", data.id)
        .eq("category_id", data.category_id)
        .limit(4)
    : await supabase
        .from("recipes")
        .select("id, title, slug, cover_image, difficulty, total_time, recipe_categories(name)")
        .eq("status", "published")
        .neq("id", data.id)
        .limit(4);

  return NextResponse.json({
    recipe: data,
    related_recipes: related ?? [],
  });
}
