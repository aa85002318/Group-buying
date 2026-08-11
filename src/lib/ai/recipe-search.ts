import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES, recipePath } from "@/lib/site-links";
import { suggestRecipes } from "@/lib/ai/bakingKnowledge";

export type MatchedRecipe = {
  id: string;
  name: string;
  slug: string;
  href: string;
  image: string | null;
  difficulty: string;
  timeMinutes: number | null;
  servings: string | null;
  missing: string[];
  matched: string[];
  reason: string;
};

function tokenize(input: string[]) {
  return input
    .flatMap((s) => s.split(/[,，、\s]+/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 1);
}

export async function searchRecipesByIngredients(rawIngredients: string[]): Promise<MatchedRecipe[]> {
  const have = tokenize(rawIngredients);
  if (have.length === 0) return [];

  if (!isSupabaseConfigured()) return knowledgeFallback(have);

  const admin = createAdminClient();
  const { data: recipes } = await admin
    .from("recipes")
    .select(
      "id, title, slug, cover_image, difficulty, total_time, prep_time, cook_time, servings, summary, recipe_ingredients(name)"
    )
    .eq("status", "published")
    .limit(80);

  const scored = (recipes ?? []).map((r) => {
    const names = ((r.recipe_ingredients as Array<{ name?: string }> | null) ?? [])
      .map((i) => String(i.name ?? "").trim())
      .filter(Boolean);
    const matched = have.filter((h) =>
      names.some((n) => n.includes(h) || h.includes(n))
    );
    const missing = names.filter(
      (n) => !have.some((h) => n.includes(h) || h.includes(n))
    );
    const score = names.length === 0 ? 0 : matched.length / Math.max(1, Math.min(names.length, 12));
    const minutes = r.total_time ?? (Number(r.prep_time ?? 0) + Number(r.cook_time ?? 0) || null);
    return {
      id: r.id as string,
      name: r.title as string,
      slug: r.slug as string,
      href: recipePath(String(r.slug)),
      image: (r.cover_image as string | null) ?? null,
      difficulty: String(r.difficulty ?? "medium"),
      timeMinutes: minutes ? Number(minutes) : null,
      servings: (r.servings as string | null) ?? null,
      missing: missing.slice(0, 8),
      matched,
      reason: matched.length
        ? `符合材料：${matched.slice(0, 4).join("、")}`
        : String(r.summary ?? "與您的材料部分相關"),
      score,
    };
  });

  const hits = scored
    .filter((r) => r.score >= 0.2 || r.matched.length >= 2)
    .sort((a, b) => b.score - a.score || a.missing.length - b.missing.length)
    .slice(0, 6);
  return hits.length ? hits : knowledgeFallback(have);
}

function knowledgeFallback(have: string[]): MatchedRecipe[] {
  return suggestRecipes(have).slice(0, 4).map((r) => ({
    id: `kb-${r.id}`,
    name: r.name,
    slug: r.id,
    href: `${APP_ROUTES.recipes}?q=${encodeURIComponent(r.name)}`,
    image: null,
    difficulty: r.difficulty,
    timeMinutes: null,
    servings: null,
    missing: r.missing,
    matched: r.needed.filter((n) => !r.missing.includes(n)),
    reason: "資料庫尚無完全符合的正式食譜，以下為一般烘焙建議",
  }));
}

export async function searchRecipesByText(query: string): Promise<MatchedRecipe[]> {
  const q = query.trim().replace(/[%_,.()]/g, " ").slice(0, 40);
  if (!q || !isSupabaseConfigured()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("recipes")
    .select(
      "id, title, slug, cover_image, difficulty, total_time, prep_time, cook_time, servings, summary"
    )
    .eq("status", "published")
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
    .limit(8);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.title as string,
    slug: r.slug as string,
    href: recipePath(String(r.slug)),
    image: (r.cover_image as string | null) ?? null,
    difficulty: String(r.difficulty ?? "medium"),
    timeMinutes: r.total_time ? Number(r.total_time) : null,
    servings: (r.servings as string | null) ?? null,
    missing: [],
    matched: [],
    reason: "標題或摘要符合關鍵字",
  }));
}
