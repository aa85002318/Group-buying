"use client";

import { IngredientChecklist } from "@/components/recipes/IngredientChecklist";
import type { RecipeIngredient, RecipePreparation, RecipeTool } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type ListLayoutProps = {
  pageType: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  ingredients?: RecipeIngredient[];
  tools?: RecipeTool[];
  preparations?: RecipePreparation[];
  multiplier: number;
  onMultiplierChange: (v: number) => void;
  haveIds: Set<string>;
  onToggleHave: (id: string) => void;
  scalingEnabled?: boolean;
  className?: string;
};

export function ListLayout({
  pageType,
  title,
  subtitle,
  body,
  ingredients = [],
  tools = [],
  preparations = [],
  multiplier,
  onMultiplierChange,
  haveIds,
  onToggleHave,
  scalingEnabled = true,
  className,
}: ListLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-[min(100dvh,820px)] w-full flex-col bg-[#FFF9EA] px-5 pb-28 pt-16 sm:px-8",
        className
      )}
    >
      <div className="mb-5 space-y-2">
        {title ? (
          <h2 className="text-2xl font-bold text-[#6B3F24] sm:text-3xl">{title}</h2>
        ) : null}
        {subtitle ? (
          <p className="text-base text-[#6B3F24]/80">{subtitle}</p>
        ) : null}
        {body ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#6B3F24]/75">
            {body}
          </p>
        ) : null}
      </div>

      {pageType === "ingredients" ? (
        <IngredientChecklist
          ingredients={ingredients}
          multiplier={multiplier}
          onMultiplierChange={onMultiplierChange}
          haveIds={haveIds}
          onToggleHave={onToggleHave}
          scalingEnabled={scalingEnabled}
          showScaleControls
        />
      ) : null}

      {pageType === "tools" ? (
        <ul className="space-y-2">
          {tools.map((t) => (
            <li
              key={t.id}
              className="border-b border-[#F2D8BF]/80 py-3 text-sm text-[#6B3F24]"
            >
              <span className="font-semibold">{t.name}</span>
              {t.notes ? (
                <span className="mt-0.5 block text-xs text-[#6B3F24]/65">{t.notes}</span>
              ) : null}
            </li>
          ))}
          {!tools.length ? (
            <p className="text-sm text-[#6B3F24]/60">尚無器具清單</p>
          ) : null}
        </ul>
      ) : null}

      {pageType === "preparation" || pageType === "preparations" ? (
        <ol className="space-y-4">
          {preparations.map((p, i) => (
            <li key={p.id} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6B3F24] text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-[#6B3F24]">{p.title || `前置 ${i + 1}`}</p>
                {p.content ? (
                  <p className="mt-1 text-sm leading-relaxed text-[#6B3F24]/75">
                    {p.content}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
          {!preparations.length ? (
            <p className="text-sm text-[#6B3F24]/60">尚無前置作業</p>
          ) : null}
        </ol>
      ) : null}

      {pageType === "scale" ? (
        <IngredientChecklist
          ingredients={ingredients}
          multiplier={multiplier}
          onMultiplierChange={onMultiplierChange}
          haveIds={haveIds}
          onToggleHave={onToggleHave}
          scalingEnabled={scalingEnabled}
          showScaleControls
        />
      ) : null}
    </div>
  );
}
