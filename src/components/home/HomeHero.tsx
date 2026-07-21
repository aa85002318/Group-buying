"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";
import { externalLinkProps, isSafeLinkUrl } from "@/lib/cms/safeHtml";
import type { CmsBanner } from "@/lib/types/database";

type Slide = {
  id: string;
  /** 僅供 aria-label / alt，不在 Banner 上顯示 */
  label: string;
  href: string | null;
  image: string | null;
  mobileImage: string | null;
};

function mapBanner(b: CmsBanner, i: number): Slide {
  const href =
    b.link_url && isSafeLinkUrl(b.link_url) ? b.link_url : null;
  return {
    id: b.id ?? `cms-${i}`,
    label: b.title || `Banner ${i + 1}`,
    href,
    image: b.image_url,
    mobileImage: b.mobile_image_url ?? null,
  };
}

function BannerImage({ slide }: { slide: Slide }) {
  const desktop = slide.image;
  const mobile = slide.mobileImage || slide.image;

  if (!desktop && !mobile) {
    return (
      <div className="flex aspect-[2/1] w-full items-center justify-center bg-surface-soft text-sm text-foreground-secondary">
        請於後台上傳 Banner 圖片（建議 1400×700 px）
      </div>
    );
  }

  return (
    <picture className="block h-full w-full">
      {slide.mobileImage ? (
        <source media="(max-width: 767px)" srcSet={slide.mobileImage} />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktop || mobile || ""}
        alt={slide.label}
        className="h-full w-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </picture>
  );
}

function SlideFrame({
  slide,
  className,
}: {
  slide: Slide;
  className?: string;
}) {
  const frame = (
    <div
      className={cn(
        "relative aspect-[2/1] w-full overflow-hidden rounded-[20px] border border-border bg-surface-soft",
        className
      )}
    >
      <BannerImage slide={slide} />
    </div>
  );

  if (slide.href) {
    return (
      <Link
        href={slide.href}
        {...externalLinkProps(slide.href)}
        className="block transition duration-200 hover:opacity-[0.97] active:scale-[0.995]"
        aria-label={slide.label}
      >
        {frame}
      </Link>
    );
  }

  return frame;
}

/** 1400×700 比例 Banner：純圖片、可點連結，無 IP / 文字 overlay */
export function HomeHero({ className }: { className?: string }) {
  const [slides, setSlides] = useState<Slide[]>([]);
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
          setSlides(list.map(mapBanner));
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

  const slide = slides[index];

  return (
    <section
      aria-label="主視覺"
      className={cn("home-hero relative mx-auto w-full max-w-[1400px]", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null || slides.length <= 1) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 40) return;
        go(dx < 0 ? 1 : -1);
      }}
    >
      {!ready ? (
        <div className="home-skeleton aspect-[2/1] w-full rounded-[20px]" />
      ) : slide ? (
        <>
          <SlideFrame slide={slide} />
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
      ) : (
        <SlideFrame
          slide={{
            id: "empty",
            label: "Banner",
            href: APP_ROUTES.shop,
            image: null,
            mobileImage: null,
          }}
        />
      )}
    </section>
  );
}
