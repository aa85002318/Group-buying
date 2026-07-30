import { RecipeWeeklyCarousel } from "./RecipeWeeklyCarousel";
import { RecipeWeeklyTitle } from "./RecipeWeeklyTitle";

/** 本週人氣食譜 — demo carousel below hero hot search. */
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
      aria-label="本週人氣食譜"
    >
      <RecipeWeeklyTitle />
      <div style={{ marginTop: 32 }}>
        <RecipeWeeklyCarousel />
      </div>
    </section>
  );
}
