"use client";

import Link from "next/link";
import {
  DEFAULT_GROUP_BUY_HERO,
  GROUP_BUY_BRAND_YELLOW,
  GROUP_BUY_HERO_MOBILE_HEIGHT,
  GROUP_BUY_HERO_MOBILE_WIDTH,
} from "@/types/group-buy-hero-banner";
import { HeroBottomTransition } from "@/components/home/HeroBottomTransition";
import { GroupBuySearchBar } from "@/components/group-buy/GroupBuySearchBar";

/**
 * Group-buy hero — copies staging homepage (`/`) chrome:
 * yellow plane → full-bleed home hero art (mobile 885×917 / desktop 1024×479)
 * → HeroBottomTransition blur seam → floating search (no drop shadow).
 *
 * Header stays outside (ShopHeader above) so icons do not overlap art.
 * Single <picture> so only one hero image renders at a time.
 */
export function GroupBuyHeroBanner({
  backgroundColor = GROUP_BUY_BRAND_YELLOW,
  searchPlaceholder = DEFAULT_GROUP_BUY_HERO.searchPlaceholder,
  onSearch,
}: {
  backgroundColor?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}) {
  const bg = backgroundColor || GROUP_BUY_BRAND_YELLOW;
  const art = DEFAULT_GROUP_BUY_HERO;

  const media = (
    <picture>
      <source media="(min-width: 768px)" srcSet={art.desktop_image} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.mobile_image}
        alt={art.alt_text}
        width={GROUP_BUY_HERO_MOBILE_WIDTH}
        height={GROUP_BUY_HERO_MOBILE_HEIGHT}
        className="home-hero-fullbleed__img w-full rounded-none"
        decoding="async"
        fetchPriority="high"
      />
    </picture>
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
