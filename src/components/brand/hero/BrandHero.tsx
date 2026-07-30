"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandHeroImage } from "./BrandHeroImage";
import { BrandHeroContent } from "./BrandHeroContent";
import { BrandHeroSearch } from "./BrandHeroSearch";
import { BrandHeroTags } from "./BrandHeroTags";
import { BrandHeroSkeleton } from "./BrandHeroSkeleton";
import { BrandHeroWave } from "./BrandHeroWave";
import {
  BRAND_HERO_DEFAULTS,
  resolveBrandHeroFallback,
} from "@/lib/brand-system/hero-defaults";
import type { BrandHeroData, BrandHeroProps, BrandHeroTag } from "./types";
import type { SearchScope } from "@/components/brand/search/types";

/** Homepage popular chips — frontend-only for this phase (admin later). */
const HOME_POPULAR_TAGS: BrandHeroTag[] = [
  { id: "t1", label: "🥐 佛卡夏", keyword: "佛卡夏", sortOrder: 10 },
  { id: "t2", label: "🍪 餅乾", keyword: "餅乾", sortOrder: 20 },
  { id: "t3", label: "🍰 蛋糕", keyword: "蛋糕", sortOrder: 30 },
  { id: "t4", label: "🧈 奶油乳酪", keyword: "奶油乳酪", sortOrder: 40 },
  { id: "t5", label: "🛒 團購", keyword: "團購", sortOrder: 50 },
  { id: "t6", label: "🥬 生鮮", keyword: "生鮮", sortOrder: 60 },
  {
    id: "more",
    label: "更多",
    keyword: "__more__",
    linkType: "url",
    targetUrl: "/products",
    sortOrder: 70,
  },
];

export function BrandHero({
  heroKey,
  data: dataProp,
  className,
  showSearch = true,
  showTags = true,
}: BrandHeroProps) {
  const [data, setData] = useState<BrandHeroData | null>(dataProp ?? null);
  const [loading, setLoading] = useState(!dataProp);
  const isHome = heroKey === "home";

  useEffect(() => {
    if (dataProp) {
      setData(dataProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/brand-system/heroes/${encodeURIComponent(heroKey)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (r.ok && d.hero) setData(d.hero as BrandHeroData);
        else setData(resolveBrandHeroFallback(heroKey));
      })
      .catch(() => {
        if (!cancelled) setData(resolveBrandHeroFallback(heroKey));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [heroKey, dataProp]);

  if (loading && !data) {
    return <BrandHeroSkeleton className={className} fullBleed={isHome} />;
  }

  const fallback = resolveBrandHeroFallback(heroKey);
  const hero = data ?? fallback;
  if (hero.enabled === false) return null;

  const scope = (hero.searchScope || "global") as SearchScope;
  const showPopularTags = showTags && hero.showPopularTags !== false;

  const imageUrl = isHome
    ? BRAND_HERO_DEFAULTS.home.desktopImageUrl
    : hero.desktopImageUrl || hero.mobileImageUrl;
  const mobileUrl = isHome
    ? BRAND_HERO_DEFAULTS.home.mobileImageUrl
    : hero.mobileImageUrl || hero.desktopImageUrl;
  const tags = isHome ? HOME_POPULAR_TAGS : hero.tags ?? [];

  if (isHome) {
    return (
      <section
        className={cn(
          "w-full max-w-full overflow-x-hidden bg-[#FFFEFA]",
          className
        )}
        aria-label={hero.name || hero.title || "品牌主視覺"}
      >
        {/*
          Full-bleed yellow plane — no card radius, no side inset, no max-width.
          Background yellow always fills the shell width; artwork uses cover.
        */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #FFD454 0%, #FFE483 55%, #FFF0B8 100%)",
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        >
          <div
            className={cn(
              "relative w-full overflow-hidden",
              // Phone: edge-to-edge cover; keep IP/text readable
              "h-[clamp(300px,78vw,440px)]",
              // Large phone / small tablet
              "min-[480px]:h-[clamp(320px,58vw,440px)]",
              // Tablet
              "md:h-[clamp(360px,48vw,480px)]",
              // Desktop — stable height as width grows
              "lg:h-[clamp(400px,34vw,520px)]",
              "xl:h-[min(500px,30vw)]"
            )}
          >
            <BrandHeroImage
              desktopUrl={imageUrl}
              mobileUrl={mobileUrl}
              alt={hero.imageAlt || "CHIMEiDIY Lifestyle 首頁主視覺"}
              position="center"
              fit="cover"
              cropArtFrame
            />

            <BrandHeroContent
              title={hero.title}
              subtitle={hero.subtitle}
              capsuleLabel={null}
              showTitle={false}
              showSubtitle={false}
              showCtas={false}
            />

            <BrandHeroWave />
          </div>
        </div>

        {/* Search + popular — inset content, not the yellow plane */}
        <div className="relative z-[6] mx-auto w-full max-w-[960px] px-5 pb-2 pt-3 md:max-w-[1100px] md:px-8 lg:max-w-[1280px] lg:px-10">
          {showSearch ? (
            <BrandHeroSearch
              placeholder={
                hero.searchPlaceholder ||
                "今天想做什麼？搜尋食譜、商品、團購、生鮮…"
              }
              scope={scope}
            />
          ) : null}
          {showPopularTags && tags.length > 0 ? (
            <BrandHeroTags tags={tags} searchScope={scope} highlightFirst />
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("w-full bg-[#FFFEFA] px-[15px] pt-2", className)}
      aria-label={hero.name || hero.title || "品牌主視覺"}
    >
      <div className="relative mx-auto w-full max-w-[1280px]">
        <div
          className="relative w-full overflow-hidden max-md:h-[280px] md:aspect-[16/9] md:max-h-[380px]"
          style={{
            borderRadius: "24px",
            background:
              "linear-gradient(135deg, #FFD454 0%, #FFE483 55%, #FFF0B8 100%)",
          }}
        >
          <BrandHeroImage
            desktopUrl={hero.desktopImageUrl}
            mobileUrl={hero.mobileImageUrl}
            alt={hero.imageAlt || hero.title}
            position={hero.imagePosition ?? "center"}
            fit="cover"
          />
          <BrandHeroContent
            title={hero.title}
            subtitle={hero.subtitle}
            capsuleLabel={hero.capsuleLabel}
            showTitle={hero.showTitle !== false}
            showSubtitle={hero.showSubtitle !== false}
            showCtas={false}
            primaryCtaLabel={hero.primaryCtaLabel}
            primaryCtaHref={hero.primaryCtaHref}
            secondaryCtaLabel={hero.secondaryCtaLabel}
            secondaryCtaHref={hero.secondaryCtaHref}
          />
          <BrandHeroWave />
        </div>

        {showSearch ? (
          <div className="relative z-[6] mx-auto w-full pt-3">
            <BrandHeroSearch
              placeholder={hero.searchPlaceholder}
              scope={scope}
            />
            {showPopularTags && (hero.tags?.length ?? 0) > 0 ? (
              <BrandHeroTags tags={hero.tags ?? []} searchScope={scope} />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
