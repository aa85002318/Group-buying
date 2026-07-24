"use client";

import { useState } from "react";
import { HelpCircle, RotateCcw, Turtle } from "lucide-react";
import { RecipeMediaPlayer } from "@/components/recipes/RecipeMediaPlayer";
import type { RecipeMedia } from "@/lib/types/database";
import type { RecipePlaybackContext } from "@/lib/recipes/media";
import { cn } from "@/lib/utils";

type MarkerChip = { id: string; label: string; seconds?: number };

type VideoLeadProps = {
  stepLabel?: string | null;
  title?: string | null;
  note?: string | null;
  media: RecipeMedia;
  pageActive: boolean;
  startSeconds?: number;
  endSeconds?: number;
  muted?: boolean;
  markers?: MarkerChip[];
  onPlaybackContext?: (ctx: RecipePlaybackContext) => void;
  onAskAi?: () => void;
  className?: string;
  bookFit?: boolean;
};

export function VideoLead({
  stepLabel,
  title,
  note,
  media,
  pageActive,
  startSeconds,
  endSeconds,
  muted,
  markers = [],
  onPlaybackContext,
  onAskAi,
  className,
  bookFit,
}: VideoLeadProps) {
  const [replayKey, setReplayKey] = useState(0);
  const [forceSlow, setForceSlow] = useState(false);

  return (
    <div
      className={cn(
        bookFit
          ? "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#1a100c] text-white"
          : "flex min-h-[min(100dvh,820px)] w-full flex-col bg-[#1a100c] text-white",
        className
      )}
    >
      <div
        className={cn(
          "shrink-0 space-y-1 px-4 sm:px-6",
          bookFit ? "pb-2 pt-3" : "pb-3 pt-16"
        )}
      >
        {stepLabel ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FF5A5F]">
            {stepLabel}
          </p>
        ) : null}
        {title ? (
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h2>
        ) : null}
      </div>

      <div className="shrink-0 px-3 sm:px-5">
        <div className="mx-auto w-full max-h-[45vh] max-w-3xl overflow-hidden rounded-xl">
          <RecipeMediaPlayer
            key={`${media.id}-${replayKey}-${forceSlow ? "slow" : "n"}`}
            media={{
              ...media,
              allow_slow_playback: true,
            }}
            active={pageActive}
            startSeconds={startSeconds}
            endSeconds={endSeconds}
            mutedOverride={muted}
            initialSpeed={forceSlow ? 0.5 : 1}
            showMarkers={false}
            onContextChange={onPlaybackContext}
            className="[&_video]:object-contain [&_.aspect-video]:max-h-[45vh]"
          />
        </div>
      </div>

      {markers.length ? (
        <div className="mt-2 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 sm:px-6">
          {markers.map((m) => (
            <span
              key={m.id}
              className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90"
            >
              {m.label}
              {m.seconds != null ? (
                <span className="ml-1 text-white/50">{Math.floor(m.seconds)}s</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-0 flex-1 space-y-3 px-4 sm:px-6",
          bookFit ? "overflow-y-auto overscroll-contain py-2" : "mt-3"
        )}
      >
        {note ? (
          <p className="text-sm leading-relaxed text-white/75">{note}</p>
        ) : null}
        <div className={cn("flex flex-wrap gap-2", bookFit ? "pb-2" : "mt-auto py-5 pb-28")}>
          <button
            type="button"
            onClick={() => setForceSlow((v) => !v)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 text-sm font-semibold"
          >
            <Turtle className="h-4 w-4" />
            {forceSlow ? "正常速度" : "慢速"}
          </button>
          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 text-sm font-semibold"
          >
            <RotateCcw className="h-4 w-4" />
            重播
          </button>
          {onAskAi ? (
            <button
              type="button"
              onClick={onAskAi}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#FF5A5F] px-3 text-sm font-semibold text-white"
            >
              <HelpCircle className="h-4 w-4" />
              我要提問
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
