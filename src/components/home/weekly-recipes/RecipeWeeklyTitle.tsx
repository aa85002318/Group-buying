import { cn } from "@/lib/utils";

export const RECIPE_WEEKLY_BADGE = "本週精選";
export const RECIPE_WEEKLY_TITLE = "精選食譜";
export const RECIPE_WEEKLY_TITLE_ID = "featured-recipes-title";

const DECORATIONS = [
  { emoji: "⭐", className: "left-[10%] top-2 text-[14px] drop-shadow-sm", keepOnNarrow: true },
  { emoji: "🍪", className: "right-[12%] top-3 text-[15px] drop-shadow-sm", keepOnNarrow: true },
  { emoji: "❤️", className: "right-[22%] bottom-8 text-[12px] drop-shadow-sm", keepOnNarrow: true },
  { emoji: "✨", className: "left-[6%] top-10 text-[11px]", keepOnNarrow: false },
  { emoji: "🥣", className: "left-[16%] bottom-6 text-[13px] drop-shadow-sm", keepOnNarrow: false },
];

/** Yellow header band: badge + title + accent + decorations. */
export function RecipeWeeklyTitle() {
  return (
    <header className="recipe-weekly-header relative z-[1] mx-auto flex w-full max-w-full flex-col items-center justify-center px-5 pb-2 pt-8 text-center md:px-8 md:pt-10">
      {DECORATIONS.map((d) => (
        <span
          key={d.emoji + d.className}
          className={cn(
            "pointer-events-none absolute select-none",
            d.className,
            !d.keepOnNarrow && "max-[374px]:hidden"
          )}
          aria-hidden="true"
        >
          {d.emoji}
        </span>
      ))}

      {/* sky-blue arc + yellow short line accents */}
      <span
        className="pointer-events-none absolute left-[28%] top-6 h-5 w-8 rounded-full border-2 border-[#87C9E8]/70 max-[374px]:hidden"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-[30%] top-8 h-0.5 w-6 rounded-full bg-[#FFD34E] max-[374px]:hidden"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-10 left-[40%] h-1.5 w-1.5 rounded-full bg-[#87C9E8] max-[374px]:hidden"
        aria-hidden="true"
      />

      <span className="inline-flex items-center rounded-full bg-[#123B73] px-3.5 py-1 text-[11px] font-semibold tracking-wide text-white sm:text-xs">
        {RECIPE_WEEKLY_BADGE}
      </span>

      <h2
        id={RECIPE_WEEKLY_TITLE_ID}
        className="recipe-weekly-section-title mt-3.5 whitespace-nowrap text-center font-extrabold text-[#123B73]"
      >
        {RECIPE_WEEKLY_TITLE}
      </h2>

      <div
        className="mb-2 mt-3.5 h-1 w-12 rounded-full bg-[#87C9E8]"
        aria-hidden="true"
      />
    </header>
  );
}

/** Dual-layer wave under yellow title band. */
export function RecipeWeeklyWave() {
  return (
    <div className="recipe-weekly-wave relative z-[1] -mb-px w-full" aria-hidden="true">
      <svg
        className="block h-[10px] w-full md:h-[14px]"
        viewBox="0 0 1440 14"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#87C9E8"
          d="M0,8 C240,2 480,14 720,8 C960,2 1200,12 1440,6 L1440,14 L0,14 Z"
        />
      </svg>
      <svg
        className="block h-[clamp(54px,12vw,76px)] w-full"
        viewBox="0 0 1440 76"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#FFFDF7"
          d="M0,28 C180,10 360,48 540,30 C720,12 900,50 1080,28 C1260,10 1380,36 1440,24 L1440,76 L0,76 Z"
        />
      </svg>
    </div>
  );
}
