"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  normalizeShopHeroList,
  type ShopHeroBanner as ShopHeroBannerType,
} from "@/types/shop-hero-banner";
import { DEFAULT_SHOP_PAGE_SETTINGS } from "@/lib/shop/page-settings";
import { cn } from "@/lib/utils";

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("//");
}

function BannerSlide({
  banner,
  priority,
}: {
  banner: ShopHeroBannerType;
  priority?: boolean;
}) {
  const desktop = banner.desktop_image;
  const mobile = banner.mobile_image || banner.desktop_image;
  const alt = banner.alt_text || banner.title;
  const openBlank = banner.link_target === "_blank" || (banner.link ? isExternalHref(banner.link) : false);

  const media = (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktop}
        alt={alt}
        className="absolute inset-0 block h-full w-full rounded-none border-0 object-cover"
        style={{ borderRadius: 0 }}
        draggable={false}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src.includes("hero-default")) return;
          el.src = DEFAULT_SHOP_HERO_BANNERS[0].desktop_image;
        }}
      />
    </picture>
  );

  const frame = (
    <div className="relative w-full aspect-[6/5] rounded-none md:aspect-[5/2]">{media}</div>
  );

  const className = cn(
    "relative min-w-0 flex-[0_0_100%]",
    banner.link ? "cursor-pointer" : "cursor-default"
  );

  if (!banner.link) {
    return <div className={className}>{frame}</div>;
  }

  if (openBlank || isExternalHref(banner.link)) {
    return (
      <a
        href={banner.link}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={alt}
      >
        {frame}
      </a>
    );
  }

  return (
    <Link href={banner.link} className={className} aria-label={alt}>
      {frame}
    </Link>
  );
}

/**
 * Full-bleed shop hero — independent block below ShopHeader.
 * Mobile 6:5 / desktop 5:2, object-cover, no radius / max-width / white frame.
 */
export function ShopHeroBanner({
  backgroundColor = DEFAULT_SHOP_PAGE_SETTINGS.hero_bg_color,
}: {
  backgroundColor?: string;
}) {
  const [banners, setBanners] = useState<ShopHeroBannerType[]>(DEFAULT_SHOP_HERO_BANNERS);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const bg = backgroundColor || DEFAULT_SHOP_PAGE_SETTINGS.hero_bg_color;
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [autoplay.current]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop/hero-banners", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setBanners(normalizeShopHeroList(json.banners));
      } catch {
        if (!cancelled) setBanners(DEFAULT_SHOP_HERO_BANNERS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    const resetTimer = () => {
      try {
        autoplay.current.reset();
      } catch {
        /* ignore */
      }
    };
    emblaApi.on("select", onSelect);
    emblaApi.on("pointerUp", resetTimer);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerUp", resetTimer);
    };
  }, [emblaApi, banners.length]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    try {
      autoplay.current.reset();
    } catch {
      /* ignore */
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    try {
      autoplay.current.reset();
    } catch {
      /* ignore */
    }
  }, [emblaApi]);

  return (
    <section
      className="relative m-0 w-full max-w-none overflow-hidden rounded-none border-0 p-0 shadow-none"
      style={{ backgroundColor: bg }}
      aria-label="商城主視覺"
      aria-busy={loading}
    >
      <div className="overflow-hidden rounded-none" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {banners.map((banner, i) => (
            <BannerSlide key={banner.id} banner={banner} priority={i === 0} />
          ))}
        </div>
      </div>

      {banners.length > 1 ? (
        <>
          <button
            type="button"
            className="shop-hero-nav shop-hero-nav--prev"
            aria-label="上一張"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="shop-hero-nav shop-hero-nav--next"
            aria-label="下一張"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="shop-hero-dots" aria-label="輪播分頁">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`第 ${i + 1} 張`}
                aria-current={i === selected ? "true" : undefined}
                className={cn("shop-hero-dot", i === selected && "shop-hero-dot--active")}
                onClick={() => {
                  emblaApi?.scrollTo(i);
                  try {
                    autoplay.current.reset();
                  } catch {
                    /* ignore */
                  }
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      {loading ? (
        <div
          className="pointer-events-none absolute inset-0 animate-pulse opacity-40"
          style={{ backgroundColor: bg }}
          aria-hidden
        />
      ) : null}
    </section>
  );
}
