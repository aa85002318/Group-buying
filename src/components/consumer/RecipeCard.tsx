"use client";

import Link from "next/link";
import { Clock3, PlayCircle } from "lucide-react";
import type { RecipeSummary } from "@/lib/consumer-hub";
import { cn } from "@/lib/utils";

const DIFFICULTY: Record<RecipeSummary["difficulty"], string> = {
  easy: "初學",
  medium: "進階",
  hard: "挑戰",
};

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const baseHref = recipe.href.split("?")[0] || recipe.href;
  const flipHref = `${baseHref}?view=full`;
  const scrollHref = `${baseHref}?view=scroll`;

  return (
    <article className="card-lift flex h-full flex-col overflow-hidden border-border-soft bg-surface">
      <Link href={flipHref} className="relative block aspect-[4/3] bg-surface-soft" aria-label={recipe.title}>
        <div className="flex h-full items-center justify-center">
          <span className="rounded-chip bg-surface-yellow px-2 py-0.5 text-sm font-bold text-brand-caramel">
            {recipe.category}
          </span>
        </div>
        {recipe.hasVideo ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">
            <PlayCircle className="h-3 w-3" aria-hidden />
            影音
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={flipHref}>
          <h3 className="line-clamp-2 text-sm font-bold text-brand-caramel">{recipe.title}</h3>
        </Link>
        <p className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
          <span className={cn("rounded-full bg-peach-soft px-2 py-0.5 text-caramel")}>
            {DIFFICULTY[recipe.difficulty]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-butter-soft px-2 py-0.5 text-caramel">
            <Clock3 className="h-3 w-3 text-brand-yellow" aria-hidden />
            {recipe.durationMinutes} 分
          </span>
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <Link
            href={flipHref}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-primary px-3 text-sm font-bold text-white"
          >
            翻頁閱讀
          </Link>
          <Link
            href={scrollHref}
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-soft bg-white px-3 text-xs font-semibold text-brand-caramel"
          >
            展開全文
          </Link>
        </div>
      </div>
    </article>
  );
}
