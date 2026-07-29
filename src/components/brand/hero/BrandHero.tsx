"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandHeroImage } from "./BrandHeroImage";
import { BrandHeroContent } from "./BrandHeroContent";
import { BrandHeroSearch } from "./BrandHeroSearch";
import { BrandHeroTags } from "./BrandHeroTags";
import { BrandHeroSkeleton } from "./BrandHeroSkeleton";
import { resolveBrandHeroFallback } from "@/lib/brand-system/hero-defaults";
import type { BrandHeroData, BrandHeroProps } from "./types";
import type { SearchScope } from "@/components/brand/search/types";

export function BrandHero({
  heroKey,
  data: dataProp,
  className,
  showSearch = true,
  showTags = true,
}: BrandHeroProps) {
  const [data, setData] = useState<BrandHeroData | null>(dataProp ?? null);
  const [loading, setLoading] = useState(!dataProp);

  useEffect(() => {
    if (dataProp) {
      setData(dataProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/brand-system/heroes/${encodeURIComponent(heroKey)}`)
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

  if (loading && !data) return <BrandHeroSkeleton className={className} />;

  const hero = data ?? resolveBrandHeroFallback(heroKey);
  if (hero.enabled === false) return null;

  const scope = (hero.searchScope || "global") as SearchScope;
  const showPopularTags = showTags && (hero.showPopularTags !== false);

  return (
    <section
      className={cn("w-full px-[15px]", className)}
      aria-label={hero.name || hero.title || "品牌主視覺"}
    >
      {/* 16:9 panel */}
      <div className="relative mx-auto w-full max-w-[1280px] overflow-hidden border border-[var(--brand-border,#f2e7df)] bg-[#fff8f1] max-[767px]:rounded-[18px] md:rounded-[24px]" style={{ aspectRatio: "16/9" }}>
        {/* Background image — fullscreen inside the panel */}
        <BrandHeroImage
          desktopUrl={hero.desktopImageUrl}
          mobileUrl={hero.mobileImageUrl}
          alt={hero.imageAlt || hero.title}
          position={hero.imagePosition ?? "center"}
        />

        {/* Light overlay so text stays readable over any photo */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" aria-hidden />

        {/* Title + subtitle — left 45% safe zone */}
        <BrandHeroContent
          title={hero.title}
          subtitle={hero.subtitle}
          showTitle={hero.showTitle !== false}
          showSubtitle={hero.showSubtitle !== false}
        />

        {/* Search + popular tags — fixed at bottom inside panel */}
        {showSearch ? (
          <div
            className="absolute z-[5]"
            style={{ right: "5%", bottom: "5%", left: "5%" }}
          >
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
