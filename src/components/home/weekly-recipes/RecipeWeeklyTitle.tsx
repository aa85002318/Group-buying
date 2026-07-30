import { cn } from "@/lib/utils";

export const RECIPE_WEEKLY_BADGE = "本週精選";
export const RECIPE_WEEKLY_TITLE = "精選食譜";
export const RECIPE_WEEKLY_TITLE_ID = "featured-recipes-title";

const DECORATIONS = [
  { emoji: "⭐", className: "left-[8%] top-1 text-[13px]", keepOnNarrow: true },
  { emoji: "🍪", className: "right-[10%] top-2 text-[14px]", keepOnNarrow: true },
  { emoji: "🥐", className: "left-[18%] bottom-0 text-[12px]", keepOnNarrow: false },
  { emoji: "❤️", className: "right-[20%] bottom-1 text-[11px]", keepOnNarrow: true },
  { emoji: "✨", className: "left-[4%] top-6 text-[10px]", keepOnNarrow: false },
  { emoji: "🥣", className: "right-[6%] top-7 text-[12px]", keepOnNarrow: false },
];

export function RecipeWeeklyTitle() {
  return (
    <header className="recipe-weekly-header relative mx-auto flex max-w-md flex-col items-center justify-center px-6 text-center">
      {DECORATIONS.map((d) => (
        <span
          key={d.emoji + d.className}
          className={cn(
            "pointer-events-none absolute select-none opacity-80",
            d.className,
            !d.keepOnNarrow && "max-[374px]:hidden"
          )}
          aria-hidden="true"
        >
          {d.emoji}
        </span>
      ))}

      <span className="inline-flex items-center rounded-full bg-[#153E73] px-3 py-1 text-[11px] font-semibold tracking-wide text-white sm:text-xs">
        {RECIPE_WEEKLY_BADGE}
      </span>

      <h2
        id={RECIPE_WEEKLY_TITLE_ID}
        className="recipe-weekly-section-title whitespace-nowrap text-center font-extrabold text-[#123B73]"
      >
        {RECIPE_WEEKLY_TITLE}
      </h2>

      <div
        className="mb-[14px] h-1 w-12 rounded-full bg-[#79C7E8]"
        aria-hidden="true"
      />
    </header>
  );
}
