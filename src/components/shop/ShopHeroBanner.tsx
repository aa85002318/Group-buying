"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEFAULT_SHOP_HERO_BANNERS,
  normalizeShopHeroList,
  type ShopHeroBanner as ShopHeroBannerType,
} from "@/types/shop-hero-banner";
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
  const media = (
    <picture>
      <source media="(max-width: 1023px)" srcSet={mobile} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktop}
        alt={banner.title}
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src.includes("hero-desktop") || el.src.includes("hero-default")) return;
          el.src = DEFAULT_SHOP_HERO_BANNERS[0].desktop_image;
        }}
      />
    </picture>
  );

  if (!banner.link) {
    return (
      <div className="shop-hero-slide relative min-w-0 flex-[0_0_100%]">
        <div className="shop-hero-frame relative w-full">{media}</div>
      </div>
    );
  }

  if (isExternalHref(banner.link)) {
    return (
      <a
        href={banner.link}
        target="_blank"
        rel="noopener noreferrer"
        className="shop-hero-slide relative min-w-0 flex-[0_0_100%] cursor-pointer"
        aria-label={banner.title}
      >
        <div className="shop-hero-frame relative w-full">{media}</div>
      </a>
    );
  }

  return (
    <Link
      href={banner.link}
      className="shop-hero-slide relative min-w-0 flex-[0_0_100%] cursor-pointer"
      aria-label={banner.title}
    >
      <div className="shop-hero-frame relative w-full">{media}</div>
    </Link>
  );
}

/**
 * Full-bleed shop hero carousel — outside page containers; CMS-backed.
 */
export function ShopHeroBanner() {
  const [banners, setBanners] = useState<ShopHeroBannerType[]>(DEFAULT_SHOP_HERO_BANNERS);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/banners?type=shop_hero", { cache: "no-store" });
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
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, banners.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      className="shop-hero-banner relative w-full overflow-hidden bg-[#FFD54F]"
      aria-label="商城主視覺"
      aria-busy={loading}
    >
      <div className="overflow-hidden" ref={emblaRef}>
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
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}

      {loading ? (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-[#FFE889]/40" aria-hidden />
      ) : null}
    </section>
  );
}
