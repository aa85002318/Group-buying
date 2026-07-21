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
    subtitle: "烘焙材料、食譜教學與限時團購一次找到",
    cta: "逛烘焙材料",
    href: APP_ROUTES.shop,
  },
  {
    id: "default-2",
    title: "一分鐘教你做",
    subtitle: "跟著影音與食譜，輕鬆完成第一盤甜點",
    cta: "看食譜",
    href: APP_ROUTES.recipes,
  },
  {
    id: "default-3",
    title: "限時團購開跑",
    subtitle: "精選原料即將收單，別錯過好價錢",
    cta: "去跟團",
    href: "/group-buy",
  },
];

function BakingDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-peach/55 blur-[1px]" />
      <span className="absolute bottom-2 right-1/4 h-20 w-20 rounded-full bg-butter/65" />
      <span className="absolute left-[42%] top-4 h-10 w-10 rounded-full bg-surface-coral" />
      {/* 奶油 */}
      <span className="absolute bottom-8 right-8 h-8 w-12 rounded-md bg-butter shadow-soft" />
      {/* 雞蛋 */}
      <span className="absolute bottom-16 right-16 h-7 w-5 rounded-full bg-surface border border-border shadow-soft" />
      {/* 打蛋器 */}
      <span className="absolute right-6 top-10 h-16 w-1.5 rotate-12 rounded-full bg-caramel/25" />
      {/* 小麥 */}
      <span className="absolute right-20 top-6 h-3 w-10 rotate-[-20deg] rounded-full bg-brand-yellow/80" />
      <span className="absolute right-24 top-10 h-3 w-8 rotate-12 rounded-full bg-brand-yellow/60" />
    </div>
  );
}

function HeroSlide({ slide, imageError }: { slide: Slide; imageError?: boolean }) {
  const linkExtra = externalLinkProps(slide.href);
  const showImage = slide.image && !imageError;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-border bg-hero-gradient shadow-soft",
        "min-h-[220px] max-h-[260px] md:min-h-[280px] md:max-h-[320px] lg:min-h-[360px] lg:max-h-[420px]"
      )}
    >
      <BakingDecor />
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFF7CF]/95 via-[#FFF2E7]/75 to-transparent" />
        </>
      ) : null}
      <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-center gap-2 p-4 sm:p-5 md:min-h-[280px] md:flex-row md:items-center md:justify-between md:px-8 lg:min-h-[360px]">
        <div className="max-w-[62%] md:max-w-[48%]">
          <p className="text-[11px] font-semibold tracking-wide text-brand-caramel/80">
            CHIMEIDIY 烘焙生活平台
          </p>
          <h2 className="mt-1 text-[24px] font-bold leading-tight tracking-tight text-brand-caramel sm:text-[26px] md:text-[36px]">
            {slide.title}
          </h2>
          <p className="mt-2 max-w-[18rem] text-sm leading-snug text-foreground-secondary md:text-base">
            {slide.subtitle}
          </p>
          <div className="mt-4">
            <Link
              href={slide.href}
              {...linkExtra}
              className="inline-flex h-11 min-h-touch items-center justify-center rounded-2xl bg-brand-primary px-5 text-sm font-bold text-white shadow-soft transition duration-200 hover:bg-primary-hover"
            >
              {slide.cta}
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 flex h-[55%] w-[42%] items-end justify-end md:relative md:h-auto md:w-[40%] md:items-center md:justify-center">
          <Image
            src="/branding/chimeidiy-app-icon.png"
            alt=""
            width={140}
            height={140}
            className="h-[96px] w-[96px] object-contain drop-shadow-md md:h-[140px] md:w-[140px]"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

/** Hero carousel — warm baking scene, swipe / autoplay / pause / keyboard */
export function HomeHero({ className }: { className?: string }) {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const touchX = useRef<number | null>(null);
  const regionRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go]);

  const current = slides[index] ?? slides[0];

  return (
    <section
      ref={regionRef}
      aria-label="主視覺"
      tabIndex={0}
      className={cn("relative outline-none", className)}
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
        <div className="home-skeleton min-h-[220px] rounded-[24px] md:min-h-[280px] lg:min-h-[360px]" />
      ) : (
        <>
          <HeroSlide
            slide={current}
            imageError={!!imgErrors[current.id]}
          />
          {/* preload error tracking via hidden imgs */}
          {current.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.image}
              alt=""
              className="hidden"
              onError={() =>
                setImgErrors((prev) => ({ ...prev, [current.id]: true }))
              }
            />
          ) : null}
          {slides.length > 1 ? (
            <div className="mt-2.5 flex justify-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`第 ${i + 1} 則 Banner`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition duration-200",
                    i === index ? "w-5 bg-brand-primary" : "w-1.5 bg-[#E6D6C7]"
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
