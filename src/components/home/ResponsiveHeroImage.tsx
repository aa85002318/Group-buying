"use client";

import {
  HOME_HERO_MOBILE_ASPECT,
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
 * Mobile and desktop art use separate frames so aspect ratio matches the asset
 * (cover would crop left/right on mobile when ratios diverge).
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
    <div className="relative z-0 w-full max-w-full overflow-hidden bg-[#FFD454]">
      {/* Mobile — intrinsic 5:4-family art; contain avoids side crop */}
      <div
        className="relative w-full md:hidden"
        style={{ aspectRatio: HOME_HERO_MOBILE_ASPECT }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileUrl}
          alt={alt}
          className="absolute inset-0 h-full w-full select-none object-contain [object-position:var(--hero-pos-mobile)]"
          style={{ ["--hero-pos-mobile" as string]: mobilePos } as React.CSSProperties}
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
          className="absolute inset-0 h-full w-full select-none object-cover [object-position:var(--hero-pos-desktop)]"
          style={{ ["--hero-pos-desktop" as string]: desktopPos } as React.CSSProperties}
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
