import { RecipeWeeklyCarousel } from "./RecipeWeeklyCarousel";
import {
  RECIPE_WEEKLY_TITLE,
  RECIPE_WEEKLY_TITLE_ID,
  RecipeWeeklyTitle,
} from "./RecipeWeeklyTitle";

/** 精選食譜 — pure white coverflow section below search / quick entry. */
export function WeeklyPopularRecipesSection() {
  return (
    <section
      className="featured-recipes-section recipe-weekly box-border w-full max-w-full overflow-x-hidden bg-white pb-8"
      aria-labelledby={RECIPE_WEEKLY_TITLE_ID}
      aria-label={RECIPE_WEEKLY_TITLE}
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <RecipeWeeklyTitle />
        <RecipeWeeklyCarousel />
      </div>
    </section>
  );
}
