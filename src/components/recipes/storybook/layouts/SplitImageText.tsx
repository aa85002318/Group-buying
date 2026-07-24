"use client";

import Image from "next/image";
import type { StorySplitDirection } from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

type SplitImageTextProps = {
  imageUrl?: string | null;
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  splitDirection?: StorySplitDirection;
  children?: React.ReactNode;
  className?: string;
  bookFit?: boolean;
};

export function SplitImageText({
  imageUrl,
  eyebrow,
  title,
  subtitle,
  body,
  splitDirection = "image_left",
  children,
  className,
  bookFit,
}: SplitImageTextProps) {
  const vertical =
    bookFit ||
    splitDirection === "image_top" ||
    splitDirection === "image_bottom";
  const imageFirst =
    splitDirection === "image_left" || splitDirection === "image_top";

  const media = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-[#2a1810]",
        bookFit
          ? "mx-auto max-h-[45vh] w-full max-w-2xl"
          : vertical
            ? "min-h-[42vh] w-full"
            : "min-h-[40vh] w-full md:min-h-full md:w-1/2"
      )}
      style={bookFit ? { aspectRatio: "16 / 9" } : undefined}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title || ""}
          fill
          className={bookFit ? "object-contain" : "object-cover"}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B3F24] to-[#1a100c]" />
      )}
    </div>
  );

  const copy = (
    <div
      className={cn(
        "flex min-h-0 flex-col justify-center",
        bookFit
          ? "w-full flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6"
          : vertical
            ? "w-full px-5 py-8 sm:px-8"
            : "w-full px-5 py-8 sm:px-8 md:w-1/2"
      )}
    >
      <div className="mx-auto w-full max-w-md space-y-2 sm:space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FF5A5F]">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="text-xl font-bold leading-tight text-[#6B3F24] sm:text-2xl">
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="text-sm text-[#6B3F24]/80 sm:text-base">{subtitle}</p>
        ) : null}
        {body ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#6B3F24]/85">
            {body}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        bookFit
          ? "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#FFF9EA]"
          : cn(
              "flex min-h-[min(100dvh,820px)] w-full overflow-hidden bg-[#FFF9EA]",
              vertical ? "flex-col" : "flex-col md:flex-row"
            ),
        className
      )}
    >
      {imageFirst ? (
        <>
          {media}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {media}
        </>
      )}
    </div>
  );
}
