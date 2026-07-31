import { RecipeWeeklyCarousel } from "./RecipeWeeklyCarousel";
import {
  RECIPE_WEEKLY_TITLE,
  RECIPE_WEEKLY_TITLE_ID,
  RecipeWeeklyTitle,
} from "./RecipeWeeklyTitle";

/** 精選食譜 — pure white coverflow; no backdrop color panel. */
export function WeeklyPopularRecipesSection() {
  return (
    <section
      className="featured-recipes-section recipe-weekly box-border w-full max-w-full overflow-x-clip bg-white"
      aria-labelledby={RECIPE_WEEKLY_TITLE_ID}
      aria-label={RECIPE_WEEKLY_TITLE}
    >
      <div className="mx-auto w-full max-w-full bg-white lg:max-w-[1100px]">
        <RecipeWeeklyTitle />
        <RecipeWeeklyCarousel />
      </div>
    </section>
  );
}
