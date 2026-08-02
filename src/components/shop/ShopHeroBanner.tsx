"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  SHOP_HERO_MOBILE_HEIGHT,
  SHOP_HERO_MOBILE_WIDTH,
  normalizeShopHeroList,
} from "@/types/shop-hero-banner";
import { DEFAULT_SHOP_PAGE_SETTINGS } from "@/lib/shop/page-settings";
import { HeroBottomTransition } from "@/components/home/HeroBottomTransition";
import { ShopSearchBar } from "@/components/shop/ShopSearchBar";

/**
 * Shop hero + search seam — mirrors homepage HomeHeroSection structure:
 * canvas (full-bleed art) → HeroBottomTransition → home-hero-search-wrap + floating search.
 * Header stays outside (in-flow above) so icons do not overlap art.
 *
 * Uses a single <picture> so only one hero image renders (not mobile+desktop stacked).
 */
export function ShopHeroBanner({
  backgroundColor = DEFAULT_SHOP_PAGE_SETTINGS.hero_bg_color,
}: {
  backgroundColor?: string;
}) {
  const [art, setArt] = useState({
    desktop: DEFAULT_SHOP_HERO_BANNERS[0].desktop_image,
    mobile:
      DEFAULT_SHOP_HERO_BANNERS[0].mobile_image ||
      DEFAULT_SHOP_HERO_BANNERS[0].desktop_image,
    alt: DEFAULT_SHOP_HERO_BANNERS[0].alt_text || DEFAULT_SHOP_HERO_BANNERS[0].title,
    href: DEFAULT_SHOP_HERO_BANNERS[0].link || "/shop/categories",
  });
  const [loading, setLoading] = useState(true);
  const bg = backgroundColor || DEFAULT_SHOP_PAGE_SETTINGS.hero_bg_color;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop/hero-banners", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const list = normalizeShopHeroList(json.banners);
        const first = list[0] ?? DEFAULT_SHOP_HERO_BANNERS[0];
        setArt({
          desktop: first.desktop_image,
          mobile: first.mobile_image || first.desktop_image,
          alt: first.alt_text || first.title,
          href: first.link || "/shop/categories",
        });
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const media = (
    <picture>
      <source media="(min-width: 768px)" srcSet={art.desktop} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.mobile}
        alt={art.alt}
        width={SHOP_HERO_MOBILE_WIDTH}
        height={SHOP_HERO_MOBILE_HEIGHT}
        className="home-hero-fullbleed__img w-full rounded-none"
        decoding="async"
        fetchPriority="high"
        onError={(e) => {
          const el = e.currentTarget;
          const fallback =
            DEFAULT_SHOP_HERO_BANNERS[0].mobile_image ||
            DEFAULT_SHOP_HERO_BANNERS[0].desktop_image;
          if (el.getAttribute("src") === fallback) return;
          el.src = fallback;
        }}
      />
    </picture>
  );

  return (
    <section
      className="shop-hero home-hero-section"
      style={{ backgroundColor: bg }}
      aria-label="商城主視覺"
      aria-busy={loading}
    >
      <div className="shop-hero-canvas home-hero-canvas" style={{ backgroundColor: bg }}>
        <div
          className="home-hero-fullbleed relative z-0 w-full rounded-none"
          style={{ backgroundColor: bg }}
        >
          {art.href ? (
            <Link href={art.href} className="block w-full" aria-label={art.alt}>
              {media}
            </Link>
          ) : (
            media
          )}
        </div>
        {/* Same as homepage: soft blur/wave seam into search */}
        <HeroBottomTransition />
      </div>

      <div className="home-hero-search-wrap">
        <ShopSearchBar />
      </div>
    </section>
  );
}
