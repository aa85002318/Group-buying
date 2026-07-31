"use client";

import {
  HOME_HERO_DESKTOP_HEIGHT,
  HOME_HERO_DESKTOP_WIDTH,
  HOME_HERO_MOBILE_HEIGHT,
  HOME_HERO_MOBILE_WIDTH,
} from "@/types/home-hero";

/**
 * Full-bleed hero — edge-to-edge width, no rounded corners, no crop.
 * Mobile + desktop: width 100%, height auto (intrinsic aspect).
 */
export function ResponsiveHeroImage({
  desktopUrl,
  mobileUrl,
  alt,
}: {
  desktopUrl: string;
  mobileUrl: string;
  alt: string;
  desktopObjectPosition?: string | null;
  mobileObjectPosition?: string | null;
}) {
  return (
    <div className="home-hero-fullbleed relative z-0 w-full rounded-none bg-[#FDE045]">
      {/* Mobile — portrait full-bleed */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mobileUrl}
        alt={alt}
        width={HOME_HERO_MOBILE_WIDTH}
        height={HOME_HERO_MOBILE_HEIGHT}
        className="home-hero-fullbleed__img block w-full rounded-none md:hidden"
        decoding="async"
        fetchPriority="high"
      />

      {/* Desktop — landscape full-bleed, no rounded frame */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktopUrl}
        alt={alt}
        width={HOME_HERO_DESKTOP_WIDTH}
        height={HOME_HERO_DESKTOP_HEIGHT}
        className="home-hero-fullbleed__img hidden w-full rounded-none md:block"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
