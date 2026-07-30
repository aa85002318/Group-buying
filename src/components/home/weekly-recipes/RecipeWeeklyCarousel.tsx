"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoRecipe } from "@/lib/home/recipe-demo";
import { demoRecipes } from "@/lib/home/recipe-demo";
import { RecipeWeeklyCard } from "./RecipeWeeklyCard";

function getActiveIndex(container: HTMLDivElement, count: number) {
  const { scrollLeft, clientWidth } = container;
  const center = scrollLeft + clientWidth / 2;
  const cards = container.querySelectorAll<HTMLElement>(".recipe-weekly-card");
  let best = 0;
  let bestDist = Infinity;
  cards.forEach((card, i) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(center - cardCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return Math.min(best, count - 1);
}

export function RecipeWeeklyCarousel({ recipes = demoRecipes }: { recipes?: DemoRecipe[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const updateActive = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setActive(getActiveIndex(el, recipes.length));
  }, [recipes.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateActive();
    el.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      el.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [updateActive]);

  const scrollTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelectorAll<HTMLElement>(".recipe-weekly-card")[index];
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActive(index);
  };

  return (
    <div className="recipe-weekly-carousel w-full">
      <div
        ref={trackRef}
        className="recipe-weekly-track flex gap-4 overflow-x-auto scroll-smooth pb-1 pt-1 [scrollbar-width:none] md:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {recipes.map((recipe) => (
          <RecipeWeeklyCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2" aria-label="輪播分頁">
        {recipes.map((recipe, i) => (
          <button
            key={recipe.id}
            type="button"
            aria-label={`第 ${i + 1} 張食譜`}
            aria-current={active === i ? "true" : undefined}
            onClick={() => scrollTo(i)}
            className="h-2.5 w-2.5 rounded-full transition"
            style={{
              background: active === i ? "#153E73" : "#C7D8E5",
              transform: active === i ? "scale(1.15)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
