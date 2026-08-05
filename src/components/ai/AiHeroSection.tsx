"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchScope } from "@/components/brand/search/types";
import {
  HOME_HERO_DEFAULTS,
  type HomeHeroData,
  type HomeHeroObjectPosition,
} from "@/types/home-hero";
import {
  FloatingSearchBar,
  type HeroSearchBarHandle,
} from "@/components/home/FloatingSearchBar";
import { HeroBottomTransition } from "@/components/home/HeroBottomTransition";
import { HeroTextContent } from "@/components/home/HeroTextContent";
import { HeroTopActions } from "@/components/home/HeroTopActions";
import { ResponsiveHeroImage } from "@/components/home/ResponsiveHeroImage";

/** Dedicated /ai hero art — not tied to home CMS images. */
const AI_HERO_IMAGE = "/brand/hero-ai-banner.jpg?v=20260805b";
const AI_HERO_ALT = "CHIMEIDIY AI 烘焙小幫手主視覺";

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

/**
 * Maps home hero CMS for chrome/settings only.
 * Image URLs are always the dedicated AI banner (caller overrides).
 */
function mapApiToHomeHero(raw: Record<string, unknown> | null): HomeHeroData {
  const base = { ...HOME_HERO_DEFAULTS };
  if (!raw) return base;

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
    desktopImageUrl: AI_HERO_IMAGE,
    mobileImageUrl: AI_HERO_IMAGE,
    imageAlt: AI_HERO_ALT,
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

/**
 * AI hub hero — same chrome as homepage; dedicated AI banner art.
 * Yellow plane → full-bleed art → blur seam → floating search.
 */
export function AiHeroSection() {
  const [data, setData] = useState<HomeHeroData>(() => ({
    ...HOME_HERO_DEFAULTS,
    desktopImageUrl: AI_HERO_IMAGE,
    mobileImageUrl: AI_HERO_IMAGE,
    imageAlt: AI_HERO_ALT,
  }));
  const searchRef = useRef<HeroSearchBarHandle>(null);

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
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  const desktopUrl = AI_HERO_IMAGE;
  const mobileUrl = AI_HERO_IMAGE;
  const alt = AI_HERO_ALT;

  return (
    <section className="home-hero home-hero-section home-hero-wrapper" aria-label="AI 主視覺">
      <header className="home-hero-top-bar home-mobile-header">
        <HeroTopActions onSearchClick={focusSearch} />
      </header>
      <div className="home-hero-canvas home-hero-content">
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

      <div className="home-hero-search-wrap">
        <FloatingSearchBar
          ref={searchRef}
          placeholder={data.searchPlaceholder}
          scope={(data.searchScope as SearchScope) || "global"}
        />
      </div>
    </section>
  );
}
