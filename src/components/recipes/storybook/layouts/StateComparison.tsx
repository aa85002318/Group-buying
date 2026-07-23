"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { StoryComparisonOption } from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

type StateComparisonProps = {
  title?: string | null;
  prompt?: string | null;
  options: StoryComparisonOption[];
  selectedId: string | null;
  onSelect: (option: StoryComparisonOption) => void;
  onAskAi?: (option: StoryComparisonOption) => void;
  className?: string;
};

export function StateComparison({
  title,
  prompt,
  options,
  selectedId,
  onSelect,
  onAskAi,
  className,
}: StateComparisonProps) {
  const selected = options.find((o) => o.id === selectedId) ?? null;

  return (
    <div
      className={cn(
        "flex min-h-[min(100dvh,820px)] w-full flex-col bg-[#FFF9EA] px-4 pb-28 pt-16 sm:px-6",
        className
      )}
    >
      <div className="space-y-2">
        {title ? (
          <h2 className="text-2xl font-bold text-[#6B3F24]">{title}</h2>
        ) : null}
        {prompt ? (
          <p className="text-sm leading-relaxed text-[#6B3F24]/80">{prompt}</p>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-5 grid gap-3",
          options.length >= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {options.map((opt) => {
          const active = opt.id === selectedId;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt)}
              className={cn(
                "overflow-hidden rounded-2xl border-2 text-left transition",
                active
                  ? "border-[#FF5A5F] bg-white shadow-[0_8px_24px_rgba(255,90,95,0.18)]"
                  : "border-transparent bg-[#F2D8BF]/45 hover:border-[#F2D8BF]"
              )}
            >
              {opt.imageUrl ? (
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={opt.imageUrl}
                    alt={opt.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[#6B3F24]/10 text-3xl font-bold text-[#6B3F24]/40">
                  {opt.label.slice(0, 1)}
                </div>
              )}
              <div className="space-y-1 p-3">
                <p className="font-bold text-[#6B3F24]">{opt.label}</p>
                {opt.caption ? (
                  <p className="text-xs text-[#6B3F24]/70">{opt.caption}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-5 space-y-3 rounded-2xl bg-[#6B3F24] p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            結果
          </p>
          <p className="text-sm leading-relaxed">
            {selected.outcome || `你選擇了「${selected.label}」。`}
          </p>
          {onAskAi ? (
            <button
              type="button"
              onClick={() => onAskAi(selected)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#FF5A5F] px-4 text-sm font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              問 AI 怎麼辦
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
