import {
  analyzeFailure,
  convertOvenTemp,
  panVolumeRatio,
  scaleRecipe,
  suggestSubstitutions,
  type OvenMode,
  type ScaleIngredient,
} from "@/lib/ai/bakingKnowledge";
import { searchRecipesByIngredients, searchRecipesByText } from "@/lib/ai/recipe-search";
import { searchShopProducts } from "@/lib/ai/product-search";
import { AI_DISCLAIMER, type AIToolId } from "@/lib/ai/types";
import { maybeExplain } from "@/lib/ai/llm";

export async function runAITool(tool: AIToolId, payload: Record<string, unknown>) {
  if (tool === "recipes") {
    const ingredients = Array.isArray(payload.ingredients)
      ? payload.ingredients.map(String)
      : String(payload.text ?? "")
          .split(/[,，、\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
    const recipes = await searchRecipesByIngredients(ingredients);
    const missing = Array.from(new Set(recipes.flatMap((r) => r.missing))).slice(0, 8);
    const products = await searchShopProducts(missing.length ? missing : ingredients);
    const explain = await maybeExplain(
      `會員現有材料：${ingredients.join("、")}。資料庫食譜：${recipes.map((r) => `${r.name}（缺 ${r.missing.join("、") || "無"}）`).join("；") || "無"}。請用 3 句說明如何挑選，不要發明食譜名稱。`
    );
    return {
      tool,
      ingredients,
      recipes,
      products,
      explain,
      disclaimer: AI_DISCLAIMER,
      fallback:
        recipes.length === 0
          ? "資料庫暫無足夠符合的正式食譜，請改用關鍵字搜尋或補充更多材料。"
          : null,
    };
  }

  if (tool === "scale") {
    const fromServings = Number(payload.fromServings) || 0;
    const toServings = Number(payload.toServings) || 0;
    const fromPan = String(payload.fromPan ?? "").trim();
    const toPan = String(payload.toPan ?? "").trim();
    const ingredients = (payload.ingredients ?? []) as ScaleIngredient[];
    const panRatio = fromPan && toPan ? panVolumeRatio(fromPan, toPan) : null;
    const factor =
      fromServings > 0 && toServings > 0
        ? toServings / fromServings
        : panRatio ?? 1;
    const scaled = scaleRecipe(ingredients, 1, factor);
    return {
      tool,
      factor: Math.round(factor * 1000) / 1000,
      panRatio,
      ingredients: scaled,
      bakeTimeHint:
        factor > 1
          ? "份量變大時，烘烤時間通常略增，請以竹籤／上色判斷，勿只乘時間。"
          : "份量變小時，提早觀察上色，避免過乾。",
      roundingNote: "液體可四捨五入至 5g；酵母／泡打粉建議精準到 0.1g。",
      notes: [
        "數學換算由系統計算，AI 不猜測重量。",
        "模具深度不同會影響實際容量，請以麵糊七八分滿為準。",
      ],
      disclaimer: AI_DISCLAIMER,
    };
  }

  if (tool === "oven") {
    const celsius = Number(payload.celsius) || 180;
    const minutes = payload.minutes != null ? Number(payload.minutes) : undefined;
    const from = String(payload.from ?? "上下火烤箱") as OvenMode;
    const to = String(payload.to ?? "旋風烤箱") as OvenMode;
    const converted = convertOvenTemp(celsius, from, to, minutes);
    return {
      tool,
      item: payload.item ?? null,
      pan: payload.pan ?? null,
      from,
      to,
      ...converted,
      disclaimer: AI_DISCLAIMER,
    };
  }

  if (tool === "substitute") {
    const ingredient = String(payload.ingredient ?? "").trim();
    const reason = String(payload.reason ?? "材料不足");
    const recipeType = String(payload.recipeType ?? "");
    const base = suggestSubstitutions(ingredient);
    const products = await searchShopProducts([
      ingredient,
      ...base.alternatives.map((a) => a.alt),
    ]);
    const allergen =
      reason === "過敏" || reason === "無麩質" || reason === "無乳製品";
    return {
      tool,
      ...base,
      reason,
      recipeType,
      products,
      adjustTogether: ["鹽／糖可能需微調", "液體比例請觀察麵糊濃稠度"],
      warnings: allergen
        ? [
            "過敏原替代無法保證成品完全不含該成分。",
            "請再次確認商品包裝標示與製造環境是否有交叉污染。",
          ]
        : reason === "素食"
          ? ["請確認替代材料與配方中其他動物性成分。"]
          : [],
      disclaimer: AI_DISCLAIMER,
    };
  }

  if (tool === "failure") {
    const symptom = String(payload.symptom ?? payload.text ?? "").trim();
    const analysis = analyzeFailure(symptom);
    const recipes = await searchRecipesByText(
      String(payload.item ?? analysis.title ?? symptom)
    );
    const products = await searchShopProducts(
      [String(payload.item ?? ""), "低筋麵粉", "烤箱溫度計"].filter(Boolean)
    );
    const uncertain = analysis.title.includes("更多資訊");
    const hasPhoto = Boolean(payload.photoPath);
    const explain = await maybeExplain(
      `品項：${payload.item}，症狀：${symptom}，溫度：${payload.celsius}，時間：${payload.minutes}，模具：${payload.pan}，${hasPhoto ? "已附失敗照片（僅供參考，不可假裝已看清細節）" : "無照片"}。規則判斷：${analysis.title}。請補充 2 句觀察重點，不可假裝已確定原因。`
    );
    return {
      tool,
      ...analysis,
      primary: analysis.causes[0] ?? null,
      secondary: analysis.causes.slice(1),
      uncertain: uncertain && !hasPhoto,
      hasPhoto,
      photoNote: hasPhoto
        ? "已收到失敗照片（僅你與系統可見，不會產生永久公開網址）。照片僅作輔助，仍請以文字描述為準。"
        : null,
      needMore: uncertain && !hasPhoto
        ? ["製作品項", "配方比例", "實際溫度與時間", "模具", "失敗照片"]
        : [],
      recipes,
      products,
      explain,
      disclaimer: AI_DISCLAIMER,
    };
  }

  const text = String(payload.text ?? "").trim();
  const recipes = await searchRecipesByText(text);
  return {
    tool: "chat",
    message: recipes.length
      ? "已從 CHIMEIDIY 食譜資料庫找到相關食譜。"
      : "請改用上方五個工具，或輸入更具體的材料／症狀。",
    recipes,
    disclaimer: AI_DISCLAIMER,
  };
}
