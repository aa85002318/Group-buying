"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
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

/** Start on the middle card so both left and right peeks are visible. */
function middleRecipeIndex(count: number) {
  if (count <= 1) return 0;
  return Math.floor((count - 1) / 2);
}

function scrollCardIntoCenter(
  container: HTMLDivElement,
  index: number,
  behavior: ScrollBehavior = "auto"
) {
  const card = container.querySelectorAll<HTMLElement>(".recipe-weekly-card")[index];
  if (!card) return;
  const cardCenter = card.offsetLeft + card.offsetWidth / 2;
  const target = cardCenter - container.clientWidth / 2;
  container.scrollTo({ left: Math.max(0, target), behavior });
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
          d="M0 48 Q195 14 390 48"
          fill="none"
        />
        <path
          className="recipe-carousel-arc-yellow"
          d="M0 61 Q195 27 390 61"
          fill="none"
        />
      </svg>
    </div>
  );
}

type DragState = {
  active: boolean;
  axis: "undecided" | "horizontal" | "vertical";
  startX: number;
  startY: number;
  scrollLeft: number;
  moved: boolean;
  pointerId: number | null;
};

export function RecipeWeeklyCarousel({ recipes = demoRecipes }: { recipes?: DemoRecipe[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const didInitCenter = useRef(false);
  const drag = useRef<DragState>({
    active: false,
    axis: "undecided",
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    moved: false,
    pointerId: null,
  });
  const [active, setActive] = useState(() => middleRecipeIndex(recipes.length));
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

  /** Center the middle recipe on first paint so left + right peeks both show. */
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el || recipes.length === 0) return;
    const mid = middleRecipeIndex(recipes.length);
    setActive(mid);
    scrollCardIntoCenter(el, mid, "auto");
    didInitCenter.current = true;
  }, [recipes.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateActive();
    el.addEventListener("scroll", scheduleUpdate, { passive: true });
    const onResize = () => {
      const current = nearestIndex(el, recipes.length);
      scrollCardIntoCenter(el, current, "auto");
      scheduleUpdate();
    };
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", onResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate, updateActive, recipes.length]);

  const scrollTo = useCallback(
    (index: number) => {
      const el = trackRef.current;
      if (!el) return;
      scrollCardIntoCenter(el, index, reducedMotion ? "auto" : "smooth");
      setActive(index);
      setShowHint(false);
    },
    [reducedMotion]
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    // Only primary button / touch — never block page scroll yet
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = {
      active: true,
      axis: "undecided",
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    const state = drag.current;
    if (!el || !state.active) return;

    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;

    if (state.axis === "undecided") {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX < 8 && absY < 8) return;

      // Vertical page scroll — do not capture or preventDefault
      if (absY >= absX) {
        state.axis = "vertical";
        state.active = false;
        return;
      }

      // Confirmed horizontal carousel drag
      state.axis = "horizontal";
      if (state.pointerId != null) {
        try {
          el.setPointerCapture(state.pointerId);
        } catch {
          // ignore
        }
      }
    }

    if (state.axis !== "horizontal") return;

    if (Math.abs(deltaX) > 6) state.moved = true;
    el.scrollLeft = state.scrollLeft - deltaX;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active && state.axis !== "horizontal") {
      drag.current = {
        active: false,
        axis: "undecided",
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        moved: false,
        pointerId: null,
      };
      return;
    }

    const wasHorizontal = state.axis === "horizontal";
    const moved = state.moved;
    if (wasHorizontal && state.pointerId != null) {
      try {
        trackRef.current?.releasePointerCapture(state.pointerId);
      } catch {
        // ignore
      }
    }

    drag.current = {
      active: false,
      axis: "undecided",
      startX: 0,
      startY: 0,
      scrollLeft: 0,
      moved: false,
      pointerId: null,
    };

    if (wasHorizontal && moved) setShowHint(false);
    if (wasHorizontal) scheduleUpdate();
    void e;
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
      className="recipe-weekly-carousel recipe-coverflow relative mx-auto w-full max-w-full bg-white md:max-w-[900px] lg:max-w-[1100px]"
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
      </div>

      {showHint ? (
        <div
          className={cn(
            "pointer-events-none z-[5] flex items-center justify-center gap-2 pb-1 text-[#123B73]/70",
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

      <div className="recipe-carousel-footer">
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
    </div>
  );
}
