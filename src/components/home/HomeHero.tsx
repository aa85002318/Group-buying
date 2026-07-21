"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";
import { externalLinkProps, isSafeLinkUrl } from "@/lib/cms/safeHtml";
import type { CmsBanner } from "@/lib/types/database";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image?: string | null;
};

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "default-1",
    title: "今天想烤什麼？",
    subtitle: "烘焙材料、食譜與團購一次找到",
    cta: "逛材料",
    href: APP_ROUTES.shop,
  },
  {
    id: "default-2",
    title: "一分鐘教你做",
    subtitle: "跟著影音輕鬆完成第一盤甜點",
    cta: "看食譜",
    href: APP_ROUTES.recipes,
  },
  {
    id: "default-3",
    title: "限時團購開跑",
    subtitle: "精選原料即將收單",
    cta: "去跟團",
    href: "/group-buy",
  },
];

function BakingDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-peach/50 md:h-36 md:w-36" />
      <span className="absolute bottom-3 right-[28%] h-14 w-14 rounded-full bg-butter/60 md:h-20 md:w-20" />
      <span className="absolute bottom-6 right-6 h-6 w-10 rounded-md bg-butter md:h-8 md:w-12" />
      <span className="absolute bottom-12 right-14 h-5 w-4 rounded-full border border-border bg-surface md:h-7 md:w-5" />
      <span className="absolute right-5 top-8 h-12 w-1 rotate-12 rounded-full bg-caramel/20 md:h-16 md:w-1.5" />
    </div>
  );
}

/** 橫向 Banner：手機高 210–240，比例約 1.7–1.9:1，不可超過 280 */
export function HomeHero({ className }: { className?: string }) {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cms?placement=home_hero")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list = (d.banners ?? []) as CmsBanner[];
        if (list.length) {
          setSlides(
            list.map((b, i) => ({
              id: b.id ?? `cms-${i}`,
              title: b.title,
              subtitle: b.subtitle || "CHIMEIDIY 烘焙生活平台",
              cta: b.button_text || "了解更多",
              href:
                b.link_url && isSafeLinkUrl(b.link_url) ? b.link_url : APP_ROUTES.shop,
              image: b.image_url,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [slides.length, paused]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + slides.length) % slides.length);
    },
    [slides.length]
  );

  const slide = slides[index] ?? slides[0];
  const linkExtra = externalLinkProps(slide.href);

  return (
    <section
      aria-label="主視覺"
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 40) return;
        go(dx < 0 ? 1 : -1);
      }}
    >
      {!ready ? (
        <div className="home-skeleton aspect-[1.8/1] w-full rounded-[20px] min-h-[210px] max-h-[240px] md:min-h-[280px] md:max-h-[320px] lg:min-h-[360px] lg:max-h-[400px]" />
      ) : (
        <>
          <div
            className={cn(
              "relative flex aspect-[1.8/1] w-full overflow-hidden rounded-[20px] border border-border bg-hero-gradient",
              "min-h-[210px] max-h-[240px] md:min-h-[280px] md:max-h-[320px] lg:min-h-[360px] lg:max-h-[400px]"
            )}
          >
            <BakingDecor />
            {slide.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-85"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFF1BE]/95 via-[#FFD7A8]/70 to-transparent" />
              </>
            ) : null}
            <div className="relative z-10 flex h-full w-full items-center justify-between gap-2 px-4 py-4 md:px-6 lg:px-8">
              <div className="max-w-[56%] min-w-0 shrink-0 lg:max-w-[48%]">
                <h2 className="line-clamp-2 text-[22px] font-bold leading-tight text-brand-caramel md:text-[30px] lg:text-[36px]">
                  {slide.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-foreground-secondary md:text-sm lg:text-base">
                  {slide.subtitle}
                </p>
                <Link
                  href={slide.href}
                  {...linkExtra}
                  className="mt-3 inline-flex h-10 min-h-[40px] items-center whitespace-nowrap rounded-2xl bg-brand-primary px-4 text-sm font-bold text-white transition duration-200 hover:bg-primary-hover md:h-11 md:px-5"
                >
                  {slide.cta}
                </Link>
              </div>
              <div className="flex h-full max-w-[42%] min-w-0 flex-1 items-end justify-end pb-1 lg:max-w-[40%]">
                <Image
                  src="/branding/chimeidiy-app-icon.png"
                  alt=""
                  width={120}
                  height={120}
                  className="h-[108px] w-[108px] object-contain drop-shadow-md md:h-[148px] md:w-[148px] lg:h-[188px] lg:w-[188px]"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
          {slides.length > 1 ? (
            <div className="mt-2 flex justify-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`第 ${i + 1} 則`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition",
                    i === index ? "w-4 bg-brand-primary" : "w-1.5 bg-[#F1D5BD]"
                  )}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
