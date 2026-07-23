"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { StoryGalleryMode } from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

type GalleryFrame = {
  id: string;
  title?: string;
  caption?: string;
  imageUrl?: string;
  number?: number;
};

type GalleryFramesProps = {
  title?: string | null;
  subtitle?: string | null;
  frames: GalleryFrame[];
  mode?: StoryGalleryMode;
  className?: string;
};

export function GalleryFrames({
  title,
  subtitle,
  frames,
  mode = "swipe",
  className,
}: GalleryFramesProps) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const items = frames.slice(0, 4);
  const current = items[index];

  if (mode === "grid_2x2" || (mode === "row" && items.length <= 4)) {
    return (
      <div
        className={cn(
          "flex min-h-[min(100dvh,820px)] w-full flex-col bg-[#FFF9EA] px-4 pb-28 pt-16 sm:px-6",
          className
        )}
      >
        <Header title={title} subtitle={subtitle} />
        <div
          className={cn(
            "mt-4 grid flex-1 gap-2",
            mode === "row" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 grid-rows-2"
          )}
        >
          {items.map((f, i) => (
            <FrameCard key={f.id} frame={f} index={i} tall={mode === "grid_2x2"} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[min(100dvh,820px)] w-full flex-col bg-[#1a100c] text-white",
        className
      )}
      onTouchStart={(e) => {
        touchX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) setIndex((i) => Math.min(items.length - 1, i + 1));
        else setIndex((i) => Math.max(0, i - 1));
      }}
    >
      <div className="px-5 pb-2 pt-16 sm:px-8">
        <Header title={title} subtitle={subtitle} light />
      </div>
      <div className="relative mx-3 flex-1 overflow-hidden rounded-2xl bg-black/40 sm:mx-6">
        {current?.imageUrl ? (
          <Image
            src={current.imageUrl}
            alt={current.title || current.caption || ""}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B3F24] to-[#1a100c]" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
          <p className="text-xs font-semibold text-white/60">
            {index + 1} / {items.length}
            {current?.number != null ? ` · #${current.number}` : ""}
          </p>
          {current?.title ? (
            <p className="mt-1 text-lg font-bold">{current.title}</p>
          ) : null}
          {current?.caption ? (
            <p className="mt-1 text-sm text-white/80">{current.caption}</p>
          ) : null}
        </div>
      </div>
      <div className="flex justify-center gap-2 py-4 pb-28">
        {items.map((f, i) => (
          <button
            key={f.id}
            type="button"
            aria-label={`第 ${i + 1} 張`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-[#FF5A5F]" : "w-2 bg-white/35"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Header({
  title,
  subtitle,
  light,
}: {
  title?: string | null;
  subtitle?: string | null;
  light?: boolean;
}) {
  return (
    <div className="space-y-1">
      {title ? (
        <h2
          className={cn(
            "text-2xl font-bold",
            light ? "text-white" : "text-[#6B3F24]"
          )}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className={cn("text-sm", light ? "text-white/70" : "text-[#6B3F24]/75")}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function FrameCard({
  frame,
  index,
  tall,
}: {
  frame: GalleryFrame;
  index: number;
  tall?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-[#2a1810]",
        tall ? "min-h-[28vh]" : "aspect-[4/5]"
      )}
    >
      {frame.imageUrl ? (
        <Image
          src={frame.imageUrl}
          alt={frame.title || frame.caption || ""}
          fill
          className="object-cover"
          sizes="50vw"
        />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
          {frame.number ?? index + 1}
        </p>
        {frame.title ? <p className="text-sm font-bold">{frame.title}</p> : null}
        {frame.caption ? (
          <p className="line-clamp-2 text-xs text-white/80">{frame.caption}</p>
        ) : null}
      </div>
    </div>
  );
}
