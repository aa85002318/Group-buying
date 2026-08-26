"use client";

import { Clock3, Users, Star } from "lucide-react";
import { DIFFICULTY_LABELS } from "@/lib/recipes/recipe-type";
import type { RecipeDifficulty } from "@/lib/types/database";

function formatMinutes(mins: number | null | undefined) {
  if (mins == null || Number.isNaN(Number(mins))) return null;
  const n = Number(mins);
  if (n <= 0) return null;
  if (n < 60) return `${n} 分鐘`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h} 小時 ${m} 分` : `${h} 小時`;
}

export function RecipeMeta({
  prepTime,
  cookTime,
  totalTime,
  servings,
  difficulty,
}: {
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  servings?: string | null;
  difficulty?: RecipeDifficulty | null;
}) {
  const time =
    formatMinutes(totalTime) ||
    formatMinutes(cookTime) ||
    formatMinutes(prepTime) ||
    null;
  const difficultyLabel = difficulty ? DIFFICULTY_LABELS[difficulty] : null;

  const items = [
    time ? { icon: Clock3, label: "製作時間", value: time } : null,
    servings ? { icon: Users, label: "份量", value: servings } : null,
    difficultyLabel ? { icon: Star, label: "難易度", value: difficultyLabel } : null,
  ].filter(Boolean) as Array<{ icon: typeof Clock3; label: string; value: string }>;

  if (!items.length) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full border border-[#E8E1D7] bg-white px-3 py-1.5 text-sm text-[#153E73]"
        >
          <item.icon className="h-4 w-4 text-[#F16458]" aria-hidden />
          <span className="text-[#8A94A6]">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
