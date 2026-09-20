"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getPageHeroPage,
  pageHeroPlacement,
  type PageHeroKey,
} from "@/lib/page-heroes";

type HeroSlide = {
  id: string;
  image: string;
  mobileImage: string | null;
  href: string | null;
  alt: string;
};

type BannerRow = {
  id: string;
  title?: string | null;
  image_url?: string | null;
  desktop_image_url?: string | null;
  mobile_image_url?: string | null;
  link_url?: string | null;
  sort_order?: number | null;
};

/**
 * Page hero: pure image + optional link, one fixed ratio everywhere
 * (3:1 on tablet/desktop; 3:2 on phones when a phone image is uploaded,
 * otherwise the 3:1 image scales down). Carousel when several are active.
 */
export function PageHeroBanner({
  pageKey,
  className,
  /** Visually-hidden page title for screen readers / SEO (banner has no text). */
  srTitle,
}: {
  pageKey: PageHeroKey;
  className?: string;
  srTitle?: string;
}) {
  const page = getPageHeroPage(pageKey);
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cms?placement=${encodeURIComponent(pageHeroPlacement(pageKey))}`)
      .then((r) => (r.ok ? r.json() : { banners: [] }))
      .then((d) => {
        if (cancelled) return;
        const rows = ((d.banners ?? []) as BannerRow[])
          .filter((b) => b.desktop_image_url || b.image_url)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setSlides(
          rows.map((b) => ({
            id: b.id,
            image: (b.desktop_image_url || b.image_url)!,
            mobileImage: b.mobile_image_url || null,
            href: b.link_url || null,
            alt: b.title || page?.label || "",
          }))
        );
      })
      .catch(() => !cancelled && setSlides([]));
    return () => {
      cancelled = true;
    };
  }, [pageKey, page?.label]);

  const list: HeroSlide[] =
    slides && slides.length
      ? slides
      : slides && page?.fallbackImage
        ? [{ id: "fallback", image: page.fallbackImage, mobileImage: null, href: null, alt: page.label }]
        : [];

  useEffect(() => {
    if (list.length <= 1) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 6000);
    return () => window.clearInterval(t);
  }, [list.length]);

  const title = srTitle ? <h1 className="sr-only">{srTitle}</h1> : null;

  // Loading: reserve the slot so the page does not jump.
  if (slides === null) {
    return (
      <section className={cn("page-hero w-full", className)} aria-busy>
        {title}
        <div className="aspect-[3/1] w-full animate-pulse bg-[#EEF3F7]" />
      </section>
    );
  }
  if (!list.length) return title;

  const slide = list[Math.min(index, list.length - 1)]!;
  const media = (
    <picture>
      {slide.mobileImage ? <source media="(max-width: 767px)" srcSet={slide.mobileImage} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.image}
        alt={slide.alt}
        className="h-full w-full object-cover object-center"
        fetchPriority="high"
      />
    </picture>
  );

  return (
    <section className={cn("page-hero relative w-full", className)} aria-label={page?.label}>
      {title}
      <div
        className={cn(
          "relative w-full overflow-hidden bg-[#EEF3F7]",
          slide.mobileImage ? "aspect-[3/2] md:aspect-[3/1]" : "aspect-[3/1]"
        )}
      >
        {slide.href ? (
          <Link href={slide.href} className="block h-full w-full" aria-label={slide.alt}>
            {media}
          </Link>
        ) : (
          media
        )}
      </div>
      {list.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {list.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`第 ${i + 1} 張`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-2 bg-white/60"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
