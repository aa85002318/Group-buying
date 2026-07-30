"use client";

import type { HomeHeroObjectPosition } from "@/types/home-hero";

function toObjectPosition(pos?: HomeHeroObjectPosition | null): string {
  switch (pos) {
    case "center left":
      return "left center";
    case "center right":
      return "right center";
    case "top":
    case "center top":
      return "center top";
    case "center":
    default:
      return "center center";
  }
}

/**
 * Show the full banner art — never crop left/right.
 * Mobile: scales to viewport width with intrinsic height.
 * Desktop: object-contain inside clamp height.
 */
export function ResponsiveHeroImage({
  desktopUrl,
  mobileUrl,
  alt,
  desktopObjectPosition = "center",
  mobileObjectPosition = "center top",
}: {
  desktopUrl: string;
  mobileUrl: string;
  alt: string;
  desktopObjectPosition?: HomeHeroObjectPosition | null;
  mobileObjectPosition?: HomeHeroObjectPosition | null;
}) {
  const desktopPos = toObjectPosition(desktopObjectPosition);
  const mobilePos = toObjectPosition(mobileObjectPosition);

  return (
    <div className="relative z-0 w-full bg-[#FFD454]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mobileUrl}
        alt={alt}
        className="block w-full max-w-full md:hidden"
        style={{ height: "auto", objectPosition: mobilePos }}
        decoding="async"
        fetchPriority="high"
      />

      <div
        className="relative hidden w-full md:block"
        style={{ height: "clamp(420px, 48vw, 720px)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={desktopUrl}
          alt={alt}
          className="h-full w-full select-none"
          style={{
            objectFit: "contain",
            objectPosition: desktopPos,
          }}
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
