"use client";

import type { RecipeIngredient } from "@/lib/types/database";

function formatAmount(ing: RecipeIngredient) {
  const amount = ing.amount?.trim() ?? "";
  const unit = ing.unit?.trim() ?? "";
  if (!amount && !unit) return "—";
  return `${amount}${unit ? ` ${unit}` : ""}`.trim();
}

export function RecipeIngredients({ ingredients }: { ingredients: RecipeIngredient[] }) {
  if (!ingredients.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-[#153E73]">材料</h2>
      <ul className="mt-4 grid gap-x-10 gap-y-2 sm:grid-cols-2">
        {ingredients.map((ing) => (
          <li
            key={ing.id}
            className="flex items-baseline justify-between gap-4 border-b border-[#E8E1D7]/80 py-2 text-sm"
          >
            <span className="min-w-0 text-[#153E73]">
              {ing.name}
              {ing.substitution_notes ? (
                <span className="mt-0.5 block text-xs text-[#8A94A6]">{ing.substitution_notes}</span>
              ) : null}
            </span>
            <span className="shrink-0 font-medium text-[#153E73]">{formatAmount(ing)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
