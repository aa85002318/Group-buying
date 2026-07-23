import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { rankRecipeRecommendations } from "@/lib/recipes/recommendations";

type Params = { params: Promise<{ id: string }> };

/** GET /api/recipes/[id]/recommendations — purchasable baking products only */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const stepId = searchParams.get("stepId");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ recommendations: [] });
  }

  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, status, product_recommendation_enabled")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
  if (recipe.product_recommendation_enabled === false) {
    return NextResponse.json({ recommendations: [] });
  }

  let query = supabase
    .from("recipe_product_recommendations")
    .select(
      "*, products(id, name, price, sale_price, image_url, is_active, stock, product_scope, status)"
    )
    .eq("recipe_id", id)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (stepId) query = query.eq("step_id", stepId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ranked = rankRecipeRecommendations(data ?? []);
  return NextResponse.json({ recommendations: ranked });
}
