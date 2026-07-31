"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LATEST_CAMPAIGN_SLIDE_SIZE,
  type HomeLatestCampaignSettings,
  type LatestCampaignSlide,
} from "@/types/home-latest-campaign";
import { cn } from "@/lib/utils";

export function LatestCampaignCarousel({
  settings,
}: {
  settings: HomeLatestCampaignSettings;
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
        const left = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
        el.scrollTo({
          left: Math.max(0, left),
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

  // Center first slide on mount
  useEffect(() => {
    const el = trackRef.current;
    const child = el?.children[0] as HTMLElement | undefined;
    if (!el || !child) return;
    const left = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="latest-campaign-carousel">
      <div
        ref={trackRef}
        className="latest-campaign-track"
        role="region"
        aria-roledescription="carousel"
        aria-label={settings.title || "最新活動"}
      >
        {slides.map((slide, i) => (
          <CarouselSlide key={slide.id} slide={slide} active={i === index} />
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="latest-campaign-dots" aria-label="輪播分頁">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`第 ${i + 1} 張`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "latest-campaign-dot",
                i === index && "latest-campaign-dot--active"
              )}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      ) : null}

      <p className="sr-only">建議圖片尺寸 {LATEST_CAMPAIGN_SLIDE_SIZE.label}</p>
    </div>
  );
}

function CarouselSlide({
  slide,
  active,
}: {
  slide: LatestCampaignSlide;
  active: boolean;
}) {
  const content = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slide.imageUrl}
      alt={slide.title}
      className="latest-campaign-slide-img"
      draggable={false}
    />
  );

  const className = cn(
    "latest-campaign-slide",
    active && "latest-campaign-slide--active"
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
