import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export const RECIPE_WEEKLY_BADGE = "本週精選";
export const RECIPE_WEEKLY_TITLE = "精選食譜";
export const RECIPE_WEEKLY_TITLE_ID = "featured-recipes-title";

/** Compact left-aligned header — not a second hero. */
export function RecipeWeeklyTitle({ title }: { title?: string }) {
  return (
    <header className="featured-recipes-header">
      <div className="featured-recipes-heading">
        <span className="featured-recipes-badge">{RECIPE_WEEKLY_BADGE}</span>
        <h2 id={RECIPE_WEEKLY_TITLE_ID}>{title || RECIPE_WEEKLY_TITLE}</h2>
        <span className="featured-recipes-accent" aria-hidden="true" />
      </div>

      <Link href={APP_ROUTES.recipes} className="featured-recipes-view-all">
        查看全部
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </Link>
    </header>
  );
}
