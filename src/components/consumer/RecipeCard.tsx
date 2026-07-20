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
  return (
    <Link
      href={recipe.href}
      className="card-lift flex h-full flex-col overflow-hidden"
      aria-label={recipe.title}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-surface-soft">
        <span className="text-sm font-bold text-foreground-secondary">{recipe.category}</span>
        {recipe.hasVideo && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-error px-2 py-0.5 text-[10px] font-black text-white">
            <PlayCircle className="h-3 w-3" aria-hidden />
            影音
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-foreground">{recipe.title}</h3>
        <p className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-foreground-secondary">
          <span className={cn("rounded-full bg-warning-soft px-2 py-0.5 text-foreground")}>
            {DIFFICULTY[recipe.difficulty]}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" aria-hidden />
            {recipe.durationMinutes} 分
          </span>
        </p>
        <span className="mt-auto pt-3 text-sm font-bold text-primary">查看食譜 →</span>
      </div>
    </Link>
  );
}
