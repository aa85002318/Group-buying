import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockRecipeBySlug, MOCK_RECIPES_DB } from "@/lib/mock/recipes";
import { rankRecipeRecommendations } from "@/lib/recipes/recommendations";
import { nestChaptersWithPages } from "@/lib/recipes/storybook";
import type {
  RecipeProductRecommendation,
  RecipeStoryChapter,
  RecipeStoryPage,
  RecipeStoryPageMedia,
} from "@/lib/types/database";

/**
 * GET /api/recipes/[id]
 * `id` may be recipe UUID or slug (detail pages use slug).
 * Optional ?include=tools,preparations,media,faq,recommendations,summaries,stories
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idOrSlug } = await params;
  const { searchParams } = new URL(request.url);
  const includeRaw = searchParams.get("include") ?? "";
  const include = new Set(
    includeRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  if (include.size === 0) {
    include.add("tools");
    include.add("preparations");
    include.add("media");
    include.add("faq");
    include.add("summaries");
    include.add("stories");
  }

  if (!isSupabaseConfigured()) {
    const recipe = getMockRecipeBySlug(idOrSlug);
    if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
    const related = MOCK_RECIPES_DB.filter(
      (r) => r.id !== recipe.id && r.category_id === recipe.category_id
    ).slice(0, 3);
    return NextResponse.json({
      recipe,
      related_recipes: related,
      tools: [],
      preparations: [],
      media: [],
      faq: [],
      stories: { chapters: [] },
      discussionSummary: { count: 0 },
      submissionSummary: { count: 0 },
    });
  }

  const supabase = await createClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  let query = supabase
    .from("recipes")
    .select(
      "*, recipe_categories(id, name, slug), recipe_ingredients(*, products(id, name, price, image_url, is_active, product_scope, stock)), recipe_steps(*, recipe_step_ai_prompts(*)), videos:related_video_id(id, title, slug, thumbnail_url, video_url, duration_seconds)"
    )
    .eq("status", "published");

  query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "食譜不存在或尚未發布" }, { status: 404 });
  }

  const recipeId = data.id as string;

  const settled = await Promise.allSettled([
    include.has("tools")
      ? supabase
          .from("recipe_tools")
          .select("*, products(id, name, price, image_url, is_active)")
          .eq("recipe_id", recipeId)
          .order("sort_order")
      : Promise.resolve({ data: null }),
    include.has("preparations")
      ? supabase
          .from("recipe_preparations")
          .select("*")
          .eq("recipe_id", recipeId)
          .order("sort_order")
      : Promise.resolve({ data: null }),
    include.has("media")
      ? supabase
          .from("recipe_media")
          .select("*, recipe_video_markers(*)")
          .eq("recipe_id", recipeId)
          .eq("is_active", true)
          .order("sort_order")
      : Promise.resolve({ data: null }),
    include.has("faq")
      ? supabase
          .from("recipe_faq")
          .select("*")
          .eq("recipe_id", recipeId)
          .eq("is_active", true)
          .order("sort_order")
      : Promise.resolve({ data: null }),
    include.has("recommendations")
      ? supabase
          .from("recipe_product_recommendations")
          .select(
            "*, products(id, name, price, sale_price, image_url, is_active, stock, product_scope)"
          )
          .eq("recipe_id", recipeId)
          .eq("is_active", true)
          .order("priority", { ascending: false })
      : Promise.resolve({ data: null }),
    include.has("summaries")
      ? supabase
          .from("recipe_discussions")
          .select("id", { count: "exact", head: true })
          .eq("recipe_id", recipeId)
          .neq("status", "hidden")
      : Promise.resolve({ count: 0 }),
    include.has("summaries")
      ? supabase
          .from("recipe_submissions")
          .select("id", { count: "exact", head: true })
          .eq("recipe_id", recipeId)
          .eq("moderation_status", "approved")
      : Promise.resolve({ count: 0 }),
    data.category_id
      ? supabase
          .from("recipes")
          .select("id, title, slug, cover_image, difficulty, total_time, recipe_categories(name)")
          .eq("status", "published")
          .neq("id", recipeId)
          .eq("category_id", data.category_id)
          .limit(4)
      : supabase
          .from("recipes")
          .select("id, title, slug, cover_image, difficulty, total_time, recipe_categories(name)")
          .eq("status", "published")
          .neq("id", recipeId)
          .limit(4),
    include.has("stories")
      ? supabase
          .from("recipe_story_chapters")
          .select("*")
          .eq("recipe_id", recipeId)
          .eq("active", true)
          .order("sort_order")
      : Promise.resolve({ data: null }),
    include.has("stories")
      ? supabase
          .from("recipe_story_pages")
          .select("*")
          .eq("recipe_id", recipeId)
          .eq("active", true)
          .order("sort_order")
      : Promise.resolve({ data: null }),
  ]);

  const value = <T,>(i: number, fallback: T): T => {
    const r = settled[i];
    if (r.status !== "fulfilled") return fallback;
    return r.value as T;
  };

  const toolsRes = value<{ data?: unknown }>(0, { data: [] });
  const prepRes = value<{ data?: unknown }>(1, { data: [] });
  const mediaRes = value<{ data?: unknown }>(2, { data: [] });
  const faqRes = value<{ data?: unknown }>(3, { data: [] });
  const recRes = value<{ data?: unknown }>(4, { data: [] });
  const discRes = value<{ count?: number | null }>(5, { count: 0 });
  const subRes = value<{ count?: number | null }>(6, { count: 0 });
  const relatedRes = value<{ data?: unknown }>(7, { data: [] });
  const storyChRes = value<{ data?: RecipeStoryChapter[] | null }>(8, { data: [] });
  const storyPageRes = value<{ data?: RecipeStoryPage[] | null }>(9, { data: [] });

  let stories: { chapters: ReturnType<typeof nestChaptersWithPages> } | undefined;
  if (include.has("stories")) {
    const pages = storyPageRes.data ?? [];
    const pageIds = pages.map((p) => p.id);
    let pageMedia: RecipeStoryPageMedia[] = [];
    if (pageIds.length) {
      const { data: mediaRows } = await supabase
        .from("recipe_story_page_media")
        .select("*")
        .in("story_page_id", pageIds)
        .eq("active", true)
        .order("sort_order");
      pageMedia = (mediaRows ?? []) as RecipeStoryPageMedia[];
    }
    stories = {
      chapters: nestChaptersWithPages(
        (storyChRes.data ?? []) as RecipeStoryChapter[],
        pages as RecipeStoryPage[],
        pageMedia
      ),
    };
  }

  if (Array.isArray(data.recipe_steps)) {
    data.recipe_steps.sort(
      (a: { sort_order?: number; step_number?: number }, b: { sort_order?: number; step_number?: number }) =>
        (a.sort_order ?? a.step_number ?? 0) - (b.sort_order ?? b.step_number ?? 0)
    );
  }
  if (Array.isArray(data.recipe_ingredients)) {
    data.recipe_ingredients.sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  }

  return NextResponse.json({
    recipe: data,
    related_recipes: relatedRes.data ?? [],
    tools: include.has("tools") ? toolsRes.data ?? [] : undefined,
    preparations: include.has("preparations") ? prepRes.data ?? [] : undefined,
    media: include.has("media") ? mediaRes.data ?? [] : undefined,
    faq: include.has("faq") ? faqRes.data ?? [] : undefined,
    recommendations: include.has("recommendations")
      ? rankRecipeRecommendations(
          (recRes.data ?? []) as RecipeProductRecommendation[]
        )
      : undefined,
    stories,
    discussionSummary: include.has("summaries")
      ? { count: discRes.count ?? 0 }
      : undefined,
    submissionSummary: include.has("summaries")
      ? { count: subRes.count ?? 0 }
      : undefined,
  });
}
