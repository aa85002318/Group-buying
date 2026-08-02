"use client";

import Link from "next/link";
import {
  DEFAULT_GROUP_BUY_HERO,
  GROUP_BUY_BRAND_YELLOW,
  GROUP_BUY_HERO_DESKTOP_HEIGHT,
  GROUP_BUY_HERO_DESKTOP_WIDTH,
  GROUP_BUY_HERO_MOBILE_HEIGHT,
  GROUP_BUY_HERO_MOBILE_WIDTH,
} from "@/types/group-buy-hero-banner";
import { HeroBottomTransition } from "@/components/home/HeroBottomTransition";
import { GroupBuySearchBar } from "@/components/group-buy/GroupBuySearchBar";

/**
 * Group-buy hero + search seam — same structure as shop / homepage:
 * canvas (full-bleed art) → HeroBottomTransition → floating search.
 * Header stays outside (in-flow above) on the yellow plane.
 */
export function GroupBuyHeroBanner({
  backgroundColor = GROUP_BUY_BRAND_YELLOW,
  searchPlaceholder = "搜尋團購活動…",
  onSearch,
}: {
  backgroundColor?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}) {
  const bg = backgroundColor || GROUP_BUY_BRAND_YELLOW;
  const art = DEFAULT_GROUP_BUY_HERO;

  const media = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.mobile_image}
        alt={art.alt_text}
        width={GROUP_BUY_HERO_MOBILE_WIDTH}
        height={GROUP_BUY_HERO_MOBILE_HEIGHT}
        className="home-hero-fullbleed__img block w-full rounded-none md:hidden"
        decoding="async"
        fetchPriority="high"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.desktop_image}
        alt={art.alt_text}
        width={GROUP_BUY_HERO_DESKTOP_WIDTH}
        height={GROUP_BUY_HERO_DESKTOP_HEIGHT}
        className="home-hero-fullbleed__img hidden w-full rounded-none md:block"
        decoding="async"
        fetchPriority="high"
      />
    </>
  );

  return (
    <section
      className="shop-hero group-buy-hero home-hero-section"
      style={{ backgroundColor: bg }}
      aria-label="團購主視覺"
    >
      <div className="shop-hero-canvas home-hero-canvas" style={{ backgroundColor: bg }}>
        <div
          className="home-hero-fullbleed relative z-0 w-full rounded-none"
          style={{ backgroundColor: bg }}
        >
          <Link href={art.link} className="block w-full" aria-label={art.alt_text}>
            {media}
          </Link>
        </div>
        <HeroBottomTransition />
      </div>

      <div className="home-hero-search-wrap">
        <GroupBuySearchBar
          placeholder={searchPlaceholder}
          onSearch={onSearch}
        />
      </div>
    </section>
  );
}
