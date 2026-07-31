"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";
import type { DemoRecipe } from "@/lib/home/recipe-demo";
import { demoRecipes } from "@/lib/home/recipe-demo";
import {
  getCardState,
  getCoverflowStyle,
  RecipeWeeklyCard,
} from "./RecipeWeeklyCard";
import { cn } from "@/lib/utils";

function nearestIndex(container: HTMLDivElement, count: number) {
  const viewportCenter = container.scrollLeft + container.clientWidth / 2;
  const cards = container.querySelectorAll<HTMLElement>(".recipe-weekly-card");
  let best = 0;
  let bestDist = Infinity;
  cards.forEach((card, i) => {
    if (i >= count) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - viewportCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return Math.min(best, count - 1);
}

/** Fixed dual arcs — outside the scroll track so they do not slide with cards. */
function RecipeCarouselArcs() {
  return (
    <div className="recipe-carousel-arcs" aria-hidden="true">
      <svg
        viewBox="0 0 390 72"
        preserveAspectRatio="none"
        focusable="false"
        aria-hidden="true"
      >
        <path
          className="recipe-carousel-arc-blue"
          d="M0 50 Q195 4 390 50"
        />
        <path
          className="recipe-carousel-arc-yellow"
          d="M0 63 Q195 17 390 63"
        />
      </svg>
    </div>
  );
}

export function RecipeWeeklyCarousel({ recipes = demoRecipes }: { recipes?: DemoRecipe[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [active, setActive] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const updateActive = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const next = nearestIndex(el, recipes.length);
    setActive((prev) => (prev === next ? prev : next));
  }, [recipes.length]);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateActive();
    });
  }, [updateActive]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateActive();
    el.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      el.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate, updateActive]);

  const scrollTo = useCallback(
    (index: number) => {
      const el = trackRef.current;
      if (!el) return;
      const card = el.querySelectorAll<HTMLElement>(".recipe-weekly-card")[index];
      card?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        inline: "center",
        block: "nearest",
      });
      setActive(index);
      setShowHint(false);
    },
    [reducedMotion]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 6) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
    if (drag.current.moved) setShowHint(false);
    scheduleUpdate();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollTo(Math.max(0, active - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollTo(Math.min(recipes.length - 1, active + 1));
    }
  };

  return (
    <div
      className="recipe-weekly-carousel recipe-coverflow relative mx-auto w-full max-w-full"
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="精選食譜"
    >
      <button
        type="button"
        aria-label="上一張食譜"
        onClick={() => scrollTo(Math.max(0, active - 1))}
        disabled={active <= 0}
        className="absolute left-2 top-[38%] z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E9EDF2] bg-white text-[#123B73] shadow-[0_8px_20px_rgba(18,59,115,0.12)] transition hover:opacity-80 disabled:opacity-40 md:inline-flex lg:left-1"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="下一張食譜"
        onClick={() => scrollTo(Math.min(recipes.length - 1, active + 1))}
        disabled={active >= recipes.length - 1}
        className="absolute right-2 top-[38%] z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E9EDF2] bg-white text-[#123B73] shadow-[0_8px_20px_rgba(18,59,115,0.12)] transition hover:opacity-80 disabled:opacity-40 md:inline-flex lg:right-1"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2} />
      </button>

      <div className="coverflow-viewport">
        <div
          ref={trackRef}
          className="coverflow-track recipe-weekly-track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onScroll={() => {
            if (!showHint) return;
            setShowHint(false);
          }}
        >
          {recipes.map((recipe, index) => {
            const state = getCardState(index, active);
            return (
              <RecipeWeeklyCard
                key={recipe.id}
                recipe={recipe}
                index={index}
                total={recipes.length}
                state={state}
                style={getCoverflowStyle(index, active)}
                onActivate={scrollTo}
              />
            );
          })}
        </div>

        {showHint ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-8 z-[5] flex items-center justify-center gap-2 text-[#123B73]/70",
              reducedMotion ? "opacity-80" : "animate-pulse"
            )}
            aria-hidden
          >
            <ChevronLeft className="h-4 w-4" />
            <Hand className="h-4 w-4" />
            <span className="text-xs font-medium">左右滑動挑選</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      <RecipeCarouselArcs />

      <div className="carousel-pagination" aria-label="輪播分頁">
        {recipes.map((recipe, i) => {
          const selected = active === i;
          return (
            <button
              key={recipe.id}
              type="button"
              aria-label={`第 ${i + 1} 張食譜`}
              aria-current={selected ? "true" : undefined}
              onClick={() => scrollTo(i)}
              className="inline-flex h-11 w-11 items-center justify-center"
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: selected ? 30 : 9,
                  height: 9,
                  background: selected ? "#123B73" : "#87C9E8",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
