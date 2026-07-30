import { RecipeWeeklyCarousel } from "./RecipeWeeklyCarousel";
import {
  RECIPE_WEEKLY_TITLE,
  RECIPE_WEEKLY_TITLE_ID,
  RecipeWeeklyTitle,
  RecipeWeeklyWave,
} from "./RecipeWeeklyTitle";

/** 精選食譜 — coverflow carousel below hero hot search. */
export function WeeklyPopularRecipesSection() {
  return (
    <section
      className="recipe-weekly featured-recipes-section mx-4 my-6 max-w-full overflow-x-hidden rounded-[28px] md:mx-6 md:rounded-[32px]"
      aria-labelledby={RECIPE_WEEKLY_TITLE_ID}
      aria-label={RECIPE_WEEKLY_TITLE}
      aria-roledescription="carousel"
    >
      <div
        className="recipe-weekly-hero relative min-h-[clamp(250px,32vh,310px)] overflow-hidden rounded-t-[28px] md:rounded-t-[32px]"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 48%), #FFD34E",
        }}
      >
        <RecipeWeeklyTitle />
        <RecipeWeeklyWave />
      </div>

      <div className="relative bg-[#FFFDF7] px-0 pb-8 pt-2 md:pb-10">
        <RecipeWeeklyCarousel />
      </div>
    </section>
  );
}
