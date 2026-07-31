"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  GROUP_BUY_BANNER_SLIDE_SIZE,
  type GroupBuyBannerSlide,
  type HomeGroupBuyBannerSettings,
} from "@/types/home-group-buy-banner";
import { cn } from "@/lib/utils";

export function GroupBuyBannerCarousel({
  settings,
}: {
  settings: HomeGroupBuyBannerSettings;
}) {
  const slides = settings.slides.filter((s) => s.enabled !== false && s.imageUrl);
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (!slides.length) return;
      const i = ((next % slides.length) + slides.length) % slides.length;
      setIndex(i);
      const el = trackRef.current;
      const child = el?.children[i] as HTMLElement | undefined;
      if (el && child) {
        el.scrollTo({
          left: child.offsetLeft,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
    },
    [slides.length, reducedMotion]
  );

  useEffect(() => {
    if (slides.length <= 1 || !settings.autoPlayMs || reducedMotion) return;
    const timer = window.setInterval(() => goTo(index + 1), settings.autoPlayMs);
    return () => window.clearInterval(timer);
  }, [slides.length, settings.autoPlayMs, goTo, index, reducedMotion]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < el.children.length; i += 1) {
        const child = el.children[i] as HTMLElement;
        const mid = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      setIndex(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="group-buy-banner-carousel">
      <div
        ref={trackRef}
        className="group-buy-banner-track"
        role="region"
        aria-roledescription="carousel"
        aria-label={settings.title || "團購 Banner"}
      >
        {slides.map((slide, i) => (
          <CarouselSlide key={slide.id} slide={slide} active={i === index} />
        ))}
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            className="group-buy-banner-nav group-buy-banner-nav--prev"
            aria-label="上一張"
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="group-buy-banner-nav group-buy-banner-nav--next"
            aria-label="下一張"
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="group-buy-banner-dots" aria-label="輪播分頁">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`第 ${i + 1} 張`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "group-buy-banner-dot",
                  i === index && "group-buy-banner-dot--active"
                )}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}

      <p className="sr-only">
        建議圖片尺寸 {GROUP_BUY_BANNER_SLIDE_SIZE.label}
      </p>
    </div>
  );
}

function CarouselSlide({
  slide,
  active,
}: {
  slide: GroupBuyBannerSlide;
  active: boolean;
}) {
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.imageUrl}
        alt={slide.title}
        className="group-buy-banner-slide-img"
        draggable={false}
      />
    </>
  );

  const className = cn(
    "group-buy-banner-slide",
    active && "group-buy-banner-slide--active"
  );

  if (slide.href) {
    return (
      <Link
        href={slide.href}
        className={className}
        aria-label={slide.title}
        aria-hidden={!active}
        tabIndex={active ? 0 : -1}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={className} aria-hidden={!active}>
      {content}
    </div>
  );
}
