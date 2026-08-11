import { aiError, aiOk } from "@/lib/ai/response";
import { searchRecipesByIngredients, searchRecipesByText } from "@/lib/ai/recipe-search";
import { resolveAIIdentity } from "@/lib/ai/identity";
import { getUsageSnapshot } from "@/lib/ai/usage";

export async function POST(request: Request) {
  const identity = await resolveAIIdentity(request);
  const snap = await getUsageSnapshot(identity);
  const body = await request.json().catch(() => ({}));
  const ingredients = Array.isArray(body.ingredients) ? body.ingredients.map(String) : [];
  const q = String(body.q ?? body.query ?? "").trim();
  if (ingredients.length === 0 && !q) {
    return aiError("VALIDATION", "請提供材料或關鍵字", { status: 400 });
  }
  const recipes = ingredients.length
    ? await searchRecipesByIngredients(ingredients)
    : await searchRecipesByText(q);
  return aiOk(
    { recipes },
    { used: snap.used, remaining: snap.remaining, resetAt: snap.resetAt }
  );
}
