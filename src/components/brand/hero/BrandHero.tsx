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

  return (
    <section
      className={cn("relative w-full", className)}
      aria-label={hero.name || hero.title || "品牌主視覺"}
    >
      <div className="brand-page-pad">
        <div
          className="relative mx-auto w-full max-w-[var(--content-max-width)] overflow-hidden border border-[var(--brand-border)] shadow-[var(--shadow-sm)]"
          style={{
            borderRadius: "var(--brand-hero-radius)",
            minHeight: "var(--brand-hero-height-mobile)",
          }}
        >
          <div
            className="relative w-full md:[min-height:var(--brand-hero-height-desktop)]"
            style={{ minHeight: "var(--brand-hero-height-mobile)" }}
          >
            <BrandHeroImage
              desktopUrl={hero.desktopImageUrl}
              mobileUrl={hero.mobileImageUrl}
              alt={hero.imageAlt || hero.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 pb-10 md:p-8 md:pb-12">
              <BrandHeroContent title={hero.title} subtitle={hero.subtitle} />
            </div>
          </div>
        </div>
      </div>

      {showSearch ? (
        <BrandHeroSearch placeholder={hero.searchPlaceholder} scope={scope} />
      ) : null}
      {showTags ? <BrandHeroTags tags={hero.tags ?? []} searchScope={scope} /> : null}
    </section>
  );
}
