"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";
import { externalLinkProps, isSafeLinkUrl } from "@/lib/cms/safeHtml";
import type { CmsBanner } from "@/lib/types/database";

type HomeHeroProps = {
  className?: string;
};

function DefaultHero() {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-hero border border-border-soft bg-hero-gradient shadow-card",
        "aspect-[16/9] min-h-[190px] max-h-[230px]",
        "md:aspect-auto md:min-h-[360px] md:max-h-[430px] md:h-[400px]"
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-peach/70 blur-[2px] md:h-56 md:w-56"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-butter/80 md:h-36 md:w-36"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[40%] top-6 h-12 w-12 rounded-full bg-primary-soft/80 md:h-16 md:w-16"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col justify-center gap-2 p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:px-10 md:py-8">
        <div className="max-w-[58%] md:max-w-[42%] md:shrink-0">
          <p className="text-[11px] font-semibold tracking-wide text-caramel/80 md:text-sm">
            CHIMEIDIY 烘焙生活平台
          </p>
          <h2 className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-caramel md:text-[44px] lg:text-[48px]">
            今天想烤什麼？
          </h2>
          <p className="mt-2 max-w-[18rem] text-sm leading-snug text-foreground-secondary md:max-w-sm md:text-base">
            烘焙材料、食譜教學與限時團購一次找到
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 md:mt-5">
            <Link
              href={APP_ROUTES.shop}
              className="inline-flex h-11 min-h-touch items-center justify-center rounded-button bg-primary px-5 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover active:scale-[0.98]"
            >
              逛烘焙材料
            </Link>
            <Link
              href={APP_ROUTES.recipes}
              className="text-sm font-semibold text-caramel underline-offset-4 transition hover:text-primary hover:underline"
            >
              看看最新食譜 →
            </Link>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 right-0 flex h-full w-[48%] items-end justify-end pr-2 pt-4 md:relative md:w-[58%] md:items-center md:justify-center md:pr-0 md:pt-0"
          aria-hidden
        >
          <div className="relative flex h-[85%] w-full max-w-[280px] items-center justify-center md:h-[90%] md:max-w-[380px]">
            <span className="absolute bottom-6 left-2 h-16 w-12 rounded-t-2xl rounded-b-md bg-surface/90 shadow-card md:bottom-10 md:left-6 md:h-24 md:w-16" />
            <span className="absolute bottom-[4.5rem] left-4 text-[10px] font-bold text-caramel/50 md:bottom-28 md:left-10 md:text-xs">
              FLOUR
            </span>
            <span className="absolute bottom-8 right-10 h-8 w-12 rounded-md bg-butter shadow-card md:bottom-14 md:right-16 md:h-10 md:w-14" />
            <span className="absolute right-4 top-8 h-20 w-1.5 rotate-12 rounded-full bg-caramel/25 md:right-10 md:top-12 md:h-28" />
            <span className="absolute right-2 top-6 h-4 w-4 rounded-full border-2 border-caramel/30 md:right-8 md:top-10 md:h-5 md:w-5" />
            <span className="absolute bottom-16 right-2 h-7 w-5 rotate-[-20deg] rounded-full bg-[#F5E6C8] shadow-card md:bottom-24 md:right-6 md:h-9 md:w-7" />
            <div className="relative z-10 mb-2 drop-shadow-[0_8px_24px_rgba(139,87,42,0.18)] md:mb-0">
              <Image
                src="/branding/chimeidiy-app-icon.png"
                alt=""
                width={160}
                height={160}
                className="h-[100px] w-[100px] object-contain md:h-[168px] md:w-[168px]"
                priority
                unoptimized
              />
            </div>
            <span className="absolute left-0 top-1/3 h-10 w-2 -rotate-45 rounded-full bg-butter md:h-14" />
            <span className="absolute left-3 top-[28%] h-8 w-1.5 -rotate-[30deg] rounded-full bg-butter/80 md:h-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CmsHeroBanner({ banner }: { banner: CmsBanner }) {
  const href =
    banner.link_url && isSafeLinkUrl(banner.link_url) ? banner.link_url : APP_ROUTES.shop;
  const linkExtra = externalLinkProps(href);
  const image = banner.image_url;
  const mobile = banner.mobile_image_url || image;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-hero border border-border-soft bg-hero-gradient shadow-card",
        "aspect-[16/9] min-h-[190px] max-h-[230px]",
        "md:aspect-auto md:min-h-[360px] md:max-h-[430px] md:h-[400px]"
      )}
    >
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobile ?? image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover md:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="absolute inset-0 hidden h-full w-full object-cover md:block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cream/90 via-cream/55 to-transparent" />
        </>
      ) : null}
      <div className="relative z-10 flex h-full flex-col justify-center gap-2 p-5 md:max-w-[48%] md:px-10 md:py-8">
        <p className="text-[11px] font-semibold tracking-wide text-caramel/80 md:text-sm">
          CHIMEIDIY
        </p>
        <h2 className="text-[26px] font-bold leading-tight tracking-tight text-caramel md:text-[40px]">
          {banner.title}
        </h2>
        {banner.subtitle ? (
          <p className="max-w-[18rem] text-sm leading-snug text-foreground-secondary md:max-w-sm md:text-base">
            {banner.subtitle}
          </p>
        ) : null}
        <div className="mt-3">
          <Link
            href={href}
            {...linkExtra}
            className="inline-flex h-11 min-h-touch items-center justify-center rounded-button bg-primary px-5 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover"
          >
            {banner.button_text || "了解更多"}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Visual-first hero — uses CMS home_hero banner when available, else brand default */
export function HomeHero({ className }: HomeHeroProps) {
  const [banner, setBanner] = useState<CmsBanner | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cms?placement=home_hero")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list = (d.banners ?? []) as CmsBanner[];
        setBanner(list[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setBanner(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="主視覺" className={cn("relative", className)}>
      {!ready ? (
        <div
          className={cn(
            "animate-pulse rounded-hero bg-muted",
            "aspect-[16/9] min-h-[190px] max-h-[230px] md:h-[400px] md:max-h-[430px] md:min-h-[360px]"
          )}
        />
      ) : banner ? (
        <CmsHeroBanner banner={banner} />
      ) : (
        <DefaultHero />
      )}
    </section>
  );
}
