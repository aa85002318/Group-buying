import { NextResponse } from "next/server";
import { loadInspirationWallRecipes } from "@/lib/shop/load-inspiration-wall";
import {
  DEMO_INSPIRATION_RECIPES,
  pickFeaturedInspiration,
} from "@/lib/shop/inspiration-wall";

/** GET /api/shop/inspiration/featured — AI 今日推薦主卡 */
export async function GET() {
  try {
    const recipes = await loadInspirationWallRecipes();
    return NextResponse.json({
      recipe: pickFeaturedInspiration(recipes),
      recipes,
    });
  } catch {
    return NextResponse.json({
      recipe: DEMO_INSPIRATION_RECIPES[0],
      recipes: DEMO_INSPIRATION_RECIPES,
    });
  }
}
