"use client";

import { Check, Sparkles } from "lucide-react";
import type { StoryCheckpointItem } from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

type CheckpointProps = {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  items: StoryCheckpointItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  continueLabel?: string;
  mismatchLabel?: string;
  onContinue?: () => void;
  onMismatchAi?: () => void;
  className?: string;
};

export function Checkpoint({
  title,
  subtitle,
  body,
  items,
  checkedIds,
  onToggle,
  continueLabel = "看起來沒問題，繼續",
  mismatchLabel = "不太對，問 AI",
  onContinue,
  onMismatchAi,
  className,
}: CheckpointProps) {
  const allDone = items.length > 0 && items.every((i) => checkedIds.has(i.id));

  return (
    <div
      className={cn(
        "flex min-h-[min(100dvh,820px)] w-full flex-col bg-[#FFF9EA] px-5 pb-28 pt-16 sm:px-8",
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FF5A5F]">
          檢查點
        </p>
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

      <ul className="mt-6 space-y-2">
        {items.map((item) => {
          const on = checkedIds.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition",
                  on ? "bg-[#6B3F24] text-white" : "bg-[#F2D8BF]/55 text-[#6B3F24]"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                    on ? "border-white bg-[#FF5A5F]" : "border-[#6B3F24]/35"
                  )}
                >
                  {on ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                </span>
                <span className="text-sm font-medium leading-relaxed">{item.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto space-y-2 pt-8">
        {onContinue ? (
          <button
            type="button"
            disabled={items.length > 0 && !allDone}
            onClick={onContinue}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white disabled:opacity-40"
          >
            {continueLabel}
          </button>
        ) : null}
        {onMismatchAi ? (
          <button
            type="button"
            onClick={onMismatchAi}
            className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl border border-[#6B3F24]/25 text-sm font-semibold text-[#6B3F24]"
          >
            <Sparkles className="h-4 w-4 text-[#FF5A5F]" />
            {mismatchLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
