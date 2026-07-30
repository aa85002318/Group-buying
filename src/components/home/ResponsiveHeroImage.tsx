"use client";

import {
  HOME_HERO_MOBILE_HEIGHT,
  HOME_HERO_MOBILE_WIDTH,
  type HomeHeroObjectPosition,
} from "@/types/home-hero";

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
 * Mobile must never crop — intrinsic dimensions + contain.
 * Desktop uses height clamp with contain.
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
      {/* Mobile: explicit intrinsic ratio — browser scales width only, never crops sides */}
      <div className="w-full md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileUrl}
          alt={alt}
          width={HOME_HERO_MOBILE_WIDTH}
          height={HOME_HERO_MOBILE_HEIGHT}
          className="home-hero-mobile-img block h-auto w-full max-w-full"
          style={{ objectFit: "contain", objectPosition: mobilePos }}
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {/* Desktop */}
      <div
        className="relative hidden w-full md:block"
        style={{ height: "clamp(420px, 48vw, 720px)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={desktopUrl}
          alt={alt}
          className="h-full w-full"
          style={{ objectFit: "contain", objectPosition: desktopPos }}
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
