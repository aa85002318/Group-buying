"use client";

import { useEffect, useState } from "react";
import { BrandHeroTags } from "@/components/brand/hero/BrandHeroTags";
import type { SearchScope } from "@/components/brand/search/types";
import {
  HOME_HERO_DEFAULTS,
  HOME_HERO_DESKTOP_IMAGE,
  HOME_HERO_MOBILE_IMAGE,
  type HomeHeroData,
  type HomeHeroObjectPosition,
} from "@/types/home-hero";
import { FloatingSearchBar } from "./FloatingSearchBar";
import { HeroBottomTransition } from "./HeroBottomTransition";
import { HeroTextContent } from "./HeroTextContent";
import { ResponsiveHeroImage } from "./ResponsiveHeroImage";

function normalizePosition(
  value: unknown,
  fallback: HomeHeroObjectPosition
): HomeHeroObjectPosition {
  if (typeof value !== "string") return fallback;
  const v = value.trim().toLowerCase();
  if (v === "left") return "center left";
  if (v === "right") return "center right";
  const allowed: HomeHeroObjectPosition[] = [
    "center",
    "center left",
    "center right",
    "top",
    "center top",
  ];
  if ((allowed as string[]).includes(v)) return v as HomeHeroObjectPosition;
  return fallback;
}

function mapApiToHomeHero(raw: Record<string, unknown> | null): HomeHeroData {
  const base = { ...HOME_HERO_DEFAULTS };
  if (!raw) return base;

  const desktop =
    (typeof raw.desktopImageUrl === "string" && raw.desktopImageUrl) ||
    (typeof raw.desktop_image_url === "string" && raw.desktop_image_url) ||
    base.desktopImageUrl;
  const mobile =
    (typeof raw.mobileImageUrl === "string" && raw.mobileImageUrl) ||
    (typeof raw.mobile_image_url === "string" && raw.mobile_image_url) ||
    desktop ||
    base.mobileImageUrl;

  const imagePosition =
    (typeof raw.imagePosition === "string" && raw.imagePosition) ||
    (typeof raw.image_position === "string" && raw.image_position) ||
    null;

  const desktopPos = normalizePosition(
    raw.desktopObjectPosition ?? raw.desktop_object_position ?? imagePosition,
    base.desktopObjectPosition || "center"
  );
  const mobilePos = normalizePosition(
    raw.mobileObjectPosition ?? raw.mobile_object_position ?? imagePosition,
    base.mobileObjectPosition || "center"
  );

  return {
    ...base,
    title: typeof raw.title === "string" ? raw.title : base.title,
    description:
      (typeof raw.description === "string" && raw.description) ||
      (typeof raw.subtitle === "string" && raw.subtitle) ||
      base.description,
    desktopImageUrl: desktop || HOME_HERO_DESKTOP_IMAGE,
    mobileImageUrl: mobile || desktop || HOME_HERO_MOBILE_IMAGE,
    imageAlt:
      (typeof raw.imageAlt === "string" && raw.imageAlt) ||
      (typeof raw.image_alt === "string" && raw.image_alt) ||
      base.imageAlt,
    desktopObjectPosition: desktopPos,
    mobileObjectPosition: mobilePos,
    searchPlaceholder:
      (typeof raw.searchPlaceholder === "string" && raw.searchPlaceholder) ||
      (typeof raw.search_placeholder === "string" && raw.search_placeholder) ||
      base.searchPlaceholder,
    searchScope:
      (typeof raw.searchScope === "string" && raw.searchScope) ||
      (typeof raw.search_scope === "string" && raw.search_scope) ||
      base.searchScope,
    showPopularTags:
      typeof raw.showPopularTags === "boolean"
        ? raw.showPopularTags
        : typeof raw.show_popular_tags === "boolean"
          ? raw.show_popular_tags
          : base.showPopularTags,
    showTitle:
      typeof raw.showTitle === "boolean"
        ? raw.showTitle
        : typeof raw.show_title === "boolean"
          ? raw.show_title
          : base.showTitle,
    showDescription:
      typeof raw.showSubtitle === "boolean"
        ? raw.showSubtitle
        : typeof raw.show_subtitle === "boolean"
          ? raw.show_subtitle
          : base.showDescription,
    tags: Array.isArray(raw.tags) ? (raw.tags as HomeHeroData["tags"]) : base.tags,
  };
}

export function HomeHeroSection() {
  const [data, setData] = useState<HomeHeroData>(HOME_HERO_DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/brand-system/heroes/home", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          hero?: Record<string, unknown>;
          data?: Record<string, unknown>;
        };
        const payload = json.hero ?? json.data;
        if (cancelled || !payload) return;
        setData(mapApiToHomeHero(payload));
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const desktopUrl = data.desktopImageUrl || HOME_HERO_DESKTOP_IMAGE;
  const mobileUrl = data.mobileImageUrl || desktopUrl || HOME_HERO_MOBILE_IMAGE;
  const alt = data.imageAlt || "CHIMEiDIY Lifestyle 首頁主視覺";

  return (
    <section className="relative w-full overflow-x-hidden bg-[#FFFEFA]" aria-label="首頁主視覺">
      {/* Yellow canvas + image + overlays */}
      <div
        className="relative w-full overflow-hidden bg-[#FFD454]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <ResponsiveHeroImage
          desktopUrl={desktopUrl}
          mobileUrl={mobileUrl}
          alt={alt}
          desktopObjectPosition={data.desktopObjectPosition}
          mobileObjectPosition={data.mobileObjectPosition}
        />
        <HeroTextContent
          title={data.title}
          description={data.description}
          showTitle={data.showTitle}
          showDescription={data.showDescription}
        />
        <HeroBottomTransition />
      </div>

      {/* Search floats above wave; reserve space so IP isn't covered */}
      <div className="relative z-10 bg-[#FFFEFA] px-4 pb-2 pt-0 md:px-6">
        <FloatingSearchBar
          placeholder={data.searchPlaceholder}
          scope={(data.searchScope as SearchScope) || "global"}
        />
        {data.showPopularTags !== false && data.tags?.length ? (
          <div className="mx-auto mt-4 w-full max-w-[1280px]">
            <BrandHeroTags
              tags={data.tags.map((t) => ({
                id: t.id,
                label: t.label,
                keyword: t.keyword,
                linkType: t.linkType,
                targetUrl: t.targetUrl,
                enabled: t.enabled,
                sortOrder: t.sortOrder,
              }))}
              searchScope={(data.searchScope as SearchScope) || "global"}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
