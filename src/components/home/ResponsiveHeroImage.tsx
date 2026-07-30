"use client";

import {
  HOME_HERO_MOBILE_ASPECT,
  type HomeHeroObjectPosition,
} from "@/types/home-hero";

function toBackgroundPosition(pos?: string | null): string {
  switch (pos) {
    case "left center":
    case "center left":
      return "left top";
    case "right center":
    case "center right":
      return "right top";
    case "center top":
      return "center top";
    case "top":
      return "center top";
    default:
      return "center top";
  }
}

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
 * Mobile: background-size 100% auto — guaranteed no left/right crop on any browser.
 * Desktop: img + object-contain inside height clamp.
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
  const mobileBgPos = toBackgroundPosition(toObjectPosition(mobileObjectPosition));

  return (
    <div className="relative z-0 w-full bg-[#FFD454]">
      {/* Mobile — background paint avoids img/object-fit cropping bugs (incl. iOS Safari) */}
      <div
        className="home-hero-mobile-bg w-full md:hidden"
        style={{
          aspectRatio: HOME_HERO_MOBILE_ASPECT,
          backgroundImage: `url("${mobileUrl}")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% auto",
          backgroundPosition: mobileBgPos,
        }}
        role="img"
        aria-label={alt}
      />

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
