import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEMO_INSPIRATION_RECIPES,
  mapRecipeRowToInspiration,
  type InspirationRecipe,
} from "@/lib/shop/inspiration-wall";

const RECIPE_SELECT =
  "id, title, slug, summary, cover_image, difficulty, prep_time, cook_time, total_time, duration_minutes, inspiration_difficulty, inspiration_category, inspiration_sort_order, is_featured_inspiration, show_in_inspiration_wall, ingredient_product_ids, inspiration_use_ip_image, inspiration_banner_url, is_featured, published_at, recipe_categories(id, name, slug)";

async function favoriteCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!ids.length) return map;
  try {
    const { data } = await supabase
      .from("favorites")
      .select("target_id")
      .eq("target_type", "recipe")
      .in("target_id", ids);
    for (const row of data ?? []) {
      const id = String((row as { target_id: string }).target_id);
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  } catch {
    /* ignore */
  }
  return map;
}

/** Published recipes for shop inspiration wall (with demo fallback). */
export async function loadInspirationWallRecipes(): Promise<InspirationRecipe[]> {
  if (!isSupabaseConfigured()) return DEMO_INSPIRATION_RECIPES;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("status", "published")
      .order("inspiration_sort_order", { ascending: true })
      .order("published_at", { ascending: false })
      .limit(48);

    if (error || !data?.length) return DEMO_INSPIRATION_RECIPES;

    const wall = data.filter(
      (r) =>
        r.show_in_inspiration_wall === true ||
        r.is_featured_inspiration === true ||
        r.is_featured === true
    );
    const rows = wall.length ? wall : data;
    const favCounts = await favoriteCounts(
      supabase,
      rows.map((r) => String(r.id))
    );
    const mapped = rows.map((row) =>
      mapRecipeRowToInspiration(
        row as Record<string, unknown>,
        favCounts.get(String(row.id)) ?? 0
      )
    );
    return mapped.length ? mapped : DEMO_INSPIRATION_RECIPES;
  } catch {
    return DEMO_INSPIRATION_RECIPES;
  }
}
