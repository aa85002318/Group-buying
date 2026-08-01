"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  normalizeShopHeroList,
} from "@/types/shop-hero-banner";
import { DEFAULT_SHOP_PAGE_SETTINGS } from "@/lib/shop/page-settings";
import { ShopHeroFeatureCapsules } from "@/components/shop/ShopHeroFeatureCapsules";

/**
 * Version A shop hero — breathing art + capsule features + soft fog/wave.
 * Not an isolated hard-cut banner; blends into floating search.
 */
export function ShopHeroBanner({
  backgroundColor = DEFAULT_SHOP_PAGE_SETTINGS.hero_bg_color,
}: {
  backgroundColor?: string;
}) {
  const [art, setArt] = useState({
    src: DEFAULT_SHOP_HERO_BANNERS[0].desktop_image,
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
          src: first.mobile_image || first.desktop_image,
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={art.src}
      alt={art.alt}
      width={1024}
      height={839}
      className="shop-hero-vA__img"
      decoding="async"
      fetchPriority="high"
      draggable={false}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src.includes("hero-default")) return;
        el.src = DEFAULT_SHOP_HERO_BANNERS[0].desktop_image;
      }}
    />
  );

  return (
    <section
      className="shop-hero-vA"
      style={{ backgroundColor: bg }}
      aria-label="商城主視覺"
      aria-busy={loading}
    >
      <div className="shop-hero-vA__inner">
        <div className="shop-hero-vA__art">
          <span className="shop-hero-sparkle shop-hero-sparkle--a" aria-hidden />
          <span className="shop-hero-sparkle shop-hero-sparkle--b" aria-hidden />
          <span className="shop-hero-sparkle shop-hero-sparkle--c" aria-hidden />
          <span className="shop-hero-glow" aria-hidden />
          {art.href ? (
            <Link href={art.href} className="shop-hero-vA__art-link" aria-label={art.alt}>
              {media}
            </Link>
          ) : (
            media
          )}
        </div>

        <ShopHeroFeatureCapsules />
      </div>

      <div className="shopHeroBlur" aria-hidden />
      <div className="shop-hero-wave" aria-hidden>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="shop-hero-wave__svg">
          <path
            fill="rgba(255,255,255,0.92)"
            d="M0,36 C220,18 380,54 560,42 C780,28 960,58 1140,40 C1280,28 1380,34 1440,30 L1440,80 L0,80 Z"
          />
        </svg>
      </div>
    </section>
  );
}
