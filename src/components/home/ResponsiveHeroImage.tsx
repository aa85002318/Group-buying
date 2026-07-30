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
 * One <picture> switch — browser fetches only the matching source.
 * Mobile ≤767px uses mobile art; desktop uses desktop art.
 */
export function ResponsiveHeroImage({
  desktopUrl,
  mobileUrl,
  alt,
  desktopObjectPosition = "center",
  mobileObjectPosition = "center",
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
    <div
      className="relative z-0 w-full overflow-hidden bg-[#FFD454] [--hero-pos-mobile:center_center] [--hero-pos-desktop:center_center]"
      style={
        {
          ["--hero-pos-mobile" as string]: mobilePos,
          ["--hero-pos-desktop" as string]: desktopPos,
        } as React.CSSProperties
      }
    >
      <style>{`
        .home-hero-frame {
          position: relative;
          width: 100%;
          aspect-ratio: ${HOME_HERO_MOBILE_ASPECT};
        }
        @media (min-width: 768px) {
          .home-hero-frame {
            aspect-ratio: auto;
            height: clamp(420px, 48vw, 720px);
          }
        }
        .home-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: var(--hero-pos-mobile);
          user-select: none;
        }
        @media (min-width: 768px) {
          .home-hero-img {
            object-position: var(--hero-pos-desktop);
          }
        }
      `}</style>
      <div className="home-hero-frame">
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileUrl} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={desktopUrl}
            alt={alt}
            className="home-hero-img"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      </div>
    </div>
  );
}
