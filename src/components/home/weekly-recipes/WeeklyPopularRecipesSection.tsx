import { RecipeWeeklyCarousel } from "./RecipeWeeklyCarousel";
import { RECIPE_WEEKLY_TITLE_ID, RecipeWeeklyTitle } from "./RecipeWeeklyTitle";

/** 精選食譜 — demo carousel below hero hot search. */
export function WeeklyPopularRecipesSection() {
  return (
    <section
      className="recipe-weekly overflow-hidden rounded-[32px]"
      style={{
        background: "linear-gradient(180deg, #F6FCFF 0%, #EEF8FC 100%)",
        boxShadow: "0 12px 40px rgba(21, 62, 115, 0.06)",
        padding: "40px 0 48px",
        margin: "24px 16px",
      }}
      aria-labelledby={RECIPE_WEEKLY_TITLE_ID}
      aria-roledescription="carousel"
    >
      <RecipeWeeklyTitle />
      <div style={{ marginTop: 32 }}>
        <RecipeWeeklyCarousel />
      </div>
    </section>
  );
}
