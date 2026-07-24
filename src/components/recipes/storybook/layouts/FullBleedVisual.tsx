"use client";

import Image from "next/image";
import type { RecipeStoryAlignment } from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

const ALIGN: Record<RecipeStoryAlignment, string> = {
  top_left: "items-start justify-start text-left",
  bottom_left: "items-end justify-start text-left",
  center: "items-center justify-center text-center",
  bottom_right: "items-end justify-end text-right",
};

const SCRIM: Record<RecipeStoryAlignment, string> = {
  top_left: "bg-gradient-to-b from-black/70 via-black/25 to-transparent",
  bottom_left: "bg-gradient-to-t from-black/75 via-black/30 to-transparent",
  center: "bg-black/45",
  bottom_right: "bg-gradient-to-t from-black/75 via-black/30 to-transparent",
};

type FullBleedVisualProps = {
  imageUrl?: string | null;
  videoUrl?: string | null;
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  alignment?: string | null;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
  bookFit?: boolean;
};

export function FullBleedVisual({
  imageUrl,
  videoUrl,
  eyebrow,
  title,
  subtitle,
  body,
  alignment,
  overlayOpacity,
  children,
  className,
  bookFit,
}: FullBleedVisualProps) {
  const align = (alignment as RecipeStoryAlignment) || "bottom_left";
  const opacity = overlayOpacity != null ? Math.min(1, Math.max(0, overlayOpacity)) : undefined;

  if (bookFit) {
    return (
      <div
        className={cn(
          "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#2a1810]",
          className
        )}
      >
        <div className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-center px-3 pt-3">
          <div
            className="relative w-full overflow-hidden rounded-xl bg-black/30"
            style={{ aspectRatio: "16 / 9", maxHeight: "45vh" }}
          >
            {videoUrl ? (
              <video
                src={videoUrl}
                className="absolute inset-0 h-full w-full object-contain"
                autoPlay
                muted
                loop
                playsInline
                poster={imageUrl ?? undefined}
              />
            ) : imageUrl ? (
              <Image
                src={imageUrl}
                alt={title || ""}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1100px) 100vw, 900px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#6B3F24] via-[#3d2416] to-[#1a100c]" />
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-xl space-y-2 text-white">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-white/85">{subtitle}</p>
            ) : null}
            {body ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {body}
              </p>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[min(100dvh,820px)] w-full flex-col overflow-hidden bg-[#2a1810]",
        className
      )}
    >
      {videoUrl ? (
        <video
          src={videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={imageUrl ?? undefined}
        />
      ) : imageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={title || ""}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1100px) 100vw, 1100px"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B3F24] via-[#3d2416] to-[#1a100c]" />
      )}

      <div
        className={cn("absolute inset-0", SCRIM[align] ?? SCRIM.bottom_left)}
        style={opacity != null ? { opacity } : undefined}
      />

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6 pb-28 pt-20 sm:p-10 sm:pb-32",
          ALIGN[align] ?? ALIGN.bottom_left
        )}
      >
        <div className="max-w-xl space-y-2 text-white sm:space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="text-sm text-white/85 sm:text-base">{subtitle}</p>
          ) : null}
          {body ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
              {body}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
