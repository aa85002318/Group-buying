import { NextResponse } from "next/server";
import {
  analyzeFailure,
  convertOvenTemp,
  scaleRecipe,
  suggestRecipes,
  suggestSubstitutions,
  type OvenMode,
  type ScaleIngredient,
} from "@/lib/ai/bakingKnowledge";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`ai-baking:${ip}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const body = await request.json();
  const action = body.action as string;

  switch (action) {
    case "recipes": {
      const ingredients = Array.isArray(body.ingredients) ? body.ingredients.map(String) : [];
      return NextResponse.json({ recipes: suggestRecipes(ingredients) });
    }
    case "scale": {
      const fromServings = Number(body.fromServings) || 4;
      const toServings = Number(body.toServings) || 12;
      const ingredients = (body.ingredients ?? []) as ScaleIngredient[];
      return NextResponse.json({
        ingredients: scaleRecipe(ingredients, fromServings, toServings),
        factor: toServings / Math.max(1, fromServings),
      });
    }
    case "oven": {
      const celsius = Number(body.celsius) || 180;
      const from = (body.from ?? "上下火") as OvenMode;
      const to = (body.to ?? "旋風") as OvenMode;
      return NextResponse.json(convertOvenTemp(celsius, from, to));
    }
    case "substitute": {
      const ingredient = String(body.ingredient ?? "").trim();
      if (!ingredient) return NextResponse.json({ error: "請輸入材料" }, { status: 400 });
      return NextResponse.json(suggestSubstitutions(ingredient));
    }
    case "failure": {
      const symptom = String(body.symptom ?? "").trim();
      if (!symptom) return NextResponse.json({ error: "請描述失敗症狀" }, { status: 400 });
      return NextResponse.json(analyzeFailure(symptom));
    }
    default:
      return NextResponse.json({ error: "未知操作" }, { status: 400 });
  }
}
