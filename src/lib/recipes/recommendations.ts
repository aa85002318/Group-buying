import type { Product, RecipeProductRecommendation } from "@/lib/types/database";

export type RankedRecommendation = RecipeProductRecommendation & {
  products?: Product | null;
  score: number;
  displayReason: string;
};

function isPurchasable(p: Product | null | undefined): boolean {
  if (!p) return false;
  if (p.is_active === false) return false;
  if (p.status && p.status !== "active") return false;
  if ((p.product_scope ?? "baking") !== "baking") return false;
  // allow preorder-ish: stock can be 0 only if we still show? Spec: 有庫存或允許預購 — treat stock>=0 active as ok, hide if explicitly inactive
  return true;
}

/** Layer 1 candidates from DB; Layer 2: deterministic rank + reason (no invented products). */
export function rankRecipeRecommendations(
  rows: RecipeProductRecommendation[]
): RankedRecommendation[] {
  const scored = rows
    .filter((r) => r.is_active !== false && isPurchasable(r.products ?? null))
    .map((r) => {
      let score = Number(r.priority ?? 0) * 10;
      if (r.manual_override) score += 1000;
      if (r.recommendation_type === "teacher_choice") score += 50;
      if (r.recommendation_type === "ingredient") score += 20;
      if (r.recommendation_type === "tool") score += 15;
      const stock = Number(r.products?.stock ?? 0);
      if (stock > 0) score += 5;
      else score -= 2;

      const displayReason =
        r.recommendation_reason?.trim() ||
        defaultReason(r.recommendation_type, r.products?.name ?? "此商品");

      return { ...r, score, displayReason };
    })
    .sort((a, b) => b.score - a.score || a.priority - b.priority);

  // Dedupe by product_id keeping highest score
  const seen = new Set<string>();
  const unique: RankedRecommendation[] = [];
  for (const row of scored) {
    if (seen.has(row.product_id)) continue;
    seen.add(row.product_id);
    unique.push(row);
  }
  return unique;
}

function defaultReason(type: string, name: string): string {
  switch (type) {
    case "substitute":
      return `${name}可作為材料替代選項，請依配方需求調整用量。`;
    case "tool":
      return `${name}有助於穩定完成此食譜的操作步驟。`;
    case "teacher_choice":
      return `老師推薦使用 ${name}，風味與穩定性較佳。`;
    case "packaging":
      return `${name}適合成品包裝與贈禮。`;
    case "decoration":
      return `${name}可用於裝飾與收尾。`;
    case "upgrade":
      return `${name}可升級配方品質與口感。`;
    default:
      return `${name}與本食譜材料／步驟相符，適合直接選購。`;
  }
}
