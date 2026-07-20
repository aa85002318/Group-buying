"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  tone?: "cream" | "groupBuy" | "recipe";
};

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "shop",
    title: "用心烘焙・幸福分享",
    subtitle: "嚴選食材 × 團購優惠 × 烘焙知識",
    cta: "立即探索",
    href: "/shop",
    tone: "cream",
  },
  {
    id: "group-buy",
    title: "限時團購開跑",
    subtitle: "優質原料・人氣好物・即將收單",
    cta: "看團購",
    href: "/group-buy",
    tone: "groupBuy",
  },
  {
    id: "recipes",
    title: "食譜與影音",
    subtitle: "一分鐘學會做甜點",
    cta: "看教學",
    href: "/recipes",
    tone: "recipe",
  },
];

const TONE_BG: Record<NonNullable<HeroSlide["tone"]>, string> = {
  cream: "bg-hero-gradient",
  groupBuy: "bg-groupBuy-soft",
  recipe: "bg-butter-soft",
};

type HeroCarouselProps = {
  slides?: HeroSlide[];
  className?: string;
};

export function HeroCarousel({ slides = DEFAULT_SLIDES, className }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <section aria-label="主視覺" className={cn("relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-hero border border-border shadow-card",
          "aspect-[1.55/1] min-h-[180px] max-h-[220px] md:aspect-[2/1] md:max-h-[280px]",
          TONE_BG[slide.tone ?? "cream"]
        )}
      >
        {/* Soft decorative blobs — no heavy graphics */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-peach/80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-2 right-4 h-16 w-16 rounded-full bg-butter/70"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-16 top-10 h-10 w-10 rounded-full bg-primary-soft"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col justify-center gap-2 p-5 md:p-8">
          <p className="text-xs font-semibold text-caramel md:text-sm">CHIMEIDIY</p>
          <h2 className="max-w-[14rem] text-xl font-bold leading-snug text-caramel break-words md:max-w-md md:text-2xl">
            {slide.title}
          </h2>
          <p className="max-w-[16rem] text-sm text-foreground-secondary md:max-w-sm">
            {slide.subtitle}
          </p>
          <Link
            href={slide.href}
            className="mt-1 inline-flex h-11 min-h-touch w-fit items-center justify-center rounded-button bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover active:bg-primary-pressed"
          >
            {slide.cta}
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2" role="tablist" aria-label="Banner 分頁">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`第 ${i + 1} 張`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 min-h-[8px] rounded-full transition",
                i === index ? "w-5 bg-primary" : "w-2 bg-border-strong"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
