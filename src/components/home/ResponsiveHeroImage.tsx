"use client";

import {
  HOME_HERO_DESKTOP_ASPECT,
  type HomeHeroObjectPosition,
} from "@/types/home-hero";

function toObjectPosition(pos?: string | null): string {
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
 * Full-bleed hero — edge-to-edge width, no side gutters.
 * Mobile: img scales to 100% viewport width (height auto, no side crop).
 * Desktop: cover fills clamp height at full width.
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
  desktopObjectPosition?: string | null;
  mobileObjectPosition?: string | null;
}) {
  const desktopPos = toObjectPosition(desktopObjectPosition);
  const mobilePos = toObjectPosition(mobileObjectPosition);

  return (
    <div className="home-hero-fullbleed relative z-0 w-full bg-[#FFD454]">
      {/* Mobile — full viewport width, intrinsic height */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mobileUrl}
        alt={alt}
        className="home-hero-fullbleed__img block w-full md:hidden"
        style={{ objectPosition: mobilePos }}
        decoding="async"
        fetchPriority="high"
      />

      {/* Desktop — full width cover */}
      <div
        className="relative hidden w-full overflow-hidden md:block"
        style={{
          height: "clamp(420px, 48vw, 720px)",
          aspectRatio: HOME_HERO_DESKTOP_ASPECT,
          maxHeight: "720px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={desktopUrl}
          alt={alt}
          className="home-hero-fullbleed__img h-full w-full"
          style={{ objectFit: "cover", objectPosition: desktopPos }}
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
