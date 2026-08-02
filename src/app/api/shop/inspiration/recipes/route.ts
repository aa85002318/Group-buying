import { NextResponse } from "next/server";
import { loadInspirationWallRecipes } from "@/lib/shop/load-inspiration-wall";
import {
  DEMO_INSPIRATION_RECIPES,
  filterInspirationByCategory,
} from "@/lib/shop/inspiration-wall";

/** GET /api/shop/inspiration/recipes?category=&limit=&featured= */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") ?? 12) || 12));
  const featuredOnly = searchParams.get("featured") === "1";

  try {
    let recipes = await loadInspirationWallRecipes();
    if (featuredOnly) {
      recipes = recipes.filter((r) => r.is_featured_inspiration);
    }
    recipes = filterInspirationByCategory(recipes, category);
    return NextResponse.json({ recipes: recipes.slice(0, limit) });
  } catch {
    const recipes = filterInspirationByCategory(DEMO_INSPIRATION_RECIPES, category).slice(
      0,
      limit
    );
    return NextResponse.json({ recipes });
  }
}
