"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandHeroImage } from "./BrandHeroImage";
import { BrandHeroContent } from "./BrandHeroContent";
import { BrandHeroSearch } from "./BrandHeroSearch";
import { BrandHeroTags } from "./BrandHeroTags";
import { BrandHeroSkeleton } from "./BrandHeroSkeleton";
import { BrandHeroWave } from "./BrandHeroWave";
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

  if (loading && !data) return <BrandHeroSkeleton className={className} />;

  const hero = data ?? resolveBrandHeroFallback(heroKey);
  if (hero.enabled === false) return null;

  const scope = (hero.searchScope || "global") as SearchScope;
  const showPopularTags = showTags && hero.showPopularTags !== false;
  const hasImage = Boolean(hero.desktopImageUrl || hero.mobileImageUrl);

  return (
    <section
      className={cn("w-full bg-[#FFFEFA] px-[15px] pt-2", className)}
      aria-label={hero.name || hero.title || "品牌主視覺"}
    >
      <div className="relative mx-auto w-full max-w-[1280px]">
        {/* Hero panel — warm lifestyle canvas */}
        <div
          className="relative w-full overflow-hidden max-md:h-[340px] md:aspect-[16/9] md:max-h-[420px]"
          style={{
            borderRadius: "var(--brand-hero-radius, 32px)",
            background: hasImage
              ? "#FFD454"
              : "radial-gradient(ellipse 80% 70% at 70% 40%, #FFE88A 0%, #FFD454 55%, #FFC93A 100%)",
          }}
        >
          <BrandHeroImage
            desktopUrl={hero.desktopImageUrl}
            mobileUrl={hero.mobileImageUrl}
            alt={hero.imageAlt || hero.title}
            position={hero.imagePosition ?? "center"}
          />

          <BrandHeroContent
            title={hero.title}
            subtitle={hero.subtitle}
            capsuleLabel={hero.capsuleLabel}
            showTitle={hero.showTitle !== false}
            showSubtitle={hero.showSubtitle !== false}
            showCtas={hero.showCtas === true}
            primaryCtaLabel={hero.primaryCtaLabel}
            primaryCtaHref={hero.primaryCtaHref}
            secondaryCtaLabel={hero.secondaryCtaLabel}
            secondaryCtaHref={hero.secondaryCtaHref}
          />

          <BrandHeroWave />
        </div>

        {/* Floating search — overlaps hero wave by ~28px */}
        {showSearch ? (
          <div
            className="relative z-[6] mx-auto w-full"
            style={{ marginTop: "calc(var(--brand-search-float, 28px) * -1)" }}
          >
            <BrandHeroSearch
              placeholder={hero.searchPlaceholder}
              scope={scope}
            />
            {showPopularTags && (hero.tags?.length ?? 0) > 0 ? (
              <BrandHeroTags tags={hero.tags ?? []} searchScope={scope} />
            ) : null}
          </div>
        ) : showPopularTags && (hero.tags?.length ?? 0) > 0 ? (
          <div className="relative z-[6] pt-4">
            <BrandHeroTags tags={hero.tags ?? []} searchScope={scope} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
