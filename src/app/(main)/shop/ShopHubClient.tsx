"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopHeroBanner } from "@/components/shop/ShopHeroBanner";
import { ShopMainCategoryMenu } from "@/components/shop/ShopMainCategoryMenu";
import { ShopPromoCarousel } from "@/components/shop/ShopPromoCarousel";
import { PopularProducts } from "@/components/shop/PopularProducts";
import { ShopFeatureBlocks } from "@/components/shop/ShopFeatureBlocks";
import { ShopNewProducts } from "@/components/shop/ShopNewProducts";
import { ShopInspirationWall } from "@/components/shop/ShopInspirationWall";
import { ShopAiRecipeAssistant } from "@/components/shop/ShopAiRecipeAssistant";
import { ShopOrderingInfo } from "@/components/shop/ShopOrderingInfo";
import { ShopCorporateInquiry } from "@/components/shop/ShopCorporateInquiry";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  SHOP_BRAND_YELLOW,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";
import {
  DEFAULT_SHOP_LAYOUT,
  mergeShopLayoutSettings,
  type ShopLayoutSectionId,
  type ShopLayoutSettings,
} from "@/lib/shop/layout-settings";

/** Older CMS yellows → unify to homepage hero yellow (#FDE045). */
const LEGACY_SHOP_YELLOWS = new Set([
  "#FEDB49",
  "#FCCA30",
  "#FFD84D",
  "#FFE149",
  "#FDE045",
]);

function resolvePlaneYellow(settings: ShopPageSettings) {
  const header = (settings.header_bg_color || "").toUpperCase();
  const hero = (settings.hero_bg_color || "").toUpperCase();
  if (!header || LEGACY_SHOP_YELLOWS.has(header)) return SHOP_BRAND_YELLOW;
  if (!hero || LEGACY_SHOP_YELLOWS.has(hero)) return SHOP_BRAND_YELLOW;
  return header;
}

function renderSection(id: ShopLayoutSectionId) {
  switch (id) {
    case "categories":
      return <ShopMainCategoryMenu key={id} />;
    case "features":
      return <ShopFeatureBlocks key={id} />;
    case "promo":
      return <ShopPromoCarousel key={id} />;
    case "popular":
      return <PopularProducts key={id} />;
    case "new":
      return <ShopNewProducts key={id} />;
    case "inspiration":
      return (
        <Suspense key={id} fallback={null}>
          <ShopInspirationWall />
        </Suspense>
      );
    case "ai-assistant":
      return <ShopAiRecipeAssistant key={id} />;
    case "info-banners":
      return (
        <div key={id} className="contents">
          <ShopOrderingInfo />
          <ShopCorporateInquiry />
        </div>
      );
    default:
      return null;
  }
}

/**
 * Shop hub layout — from search bar to footer, every major block is 20px apart.
 * Section order / visibility come from CMS layout (draft preview via ?preview=draft).
 */
export function ShopHubClient() {
  const [layout, setLayout] = useState<ShopLayoutSettings>(DEFAULT_SHOP_LAYOUT);

  useEffect(() => {
    let cancelled = false;
    const previewDraft =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "draft";
    const url = previewDraft
      ? "/api/shop/layout?preview=draft"
      : "/api/shop/layout";

    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.settings) return;
        setLayout(mergeShopLayoutSettings(d.settings));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pageSettings = layout.appearance ?? DEFAULT_SHOP_PAGE_SETTINGS;
  const planeYellow = resolvePlaneYellow(pageSettings);
  const unifiedSettings: ShopPageSettings = {
    ...pageSettings,
    header_bg_color: planeYellow,
    hero_bg_color: planeYellow,
    header_border_color: null,
  };

  const mainSections = useMemo(() => {
    return layout.sectionOrder.filter(
      (id) => id !== "hero" && layout.sections[id] !== false
    );
  }, [layout]);

  const showHero = layout.sections.hero !== false;

  return (
    <div className="shop-hub space-y-0 bg-white">
      <div
        className="shop-hub-hero-plane w-full max-w-none"
        style={{ backgroundColor: planeYellow }}
      >
        <ShopHeader settings={unifiedSettings} title="商城" />
        {showHero ? <ShopHeroBanner backgroundColor={planeYellow} /> : null}
      </div>

      <main className="shop-hub-main flex flex-col gap-[20px] pb-[20px]">
        {mainSections.map((id) => renderSection(id))}

        <div className="shop-hub-body mx-auto w-full max-w-7xl px-4 md:px-6">
          <Link
            href="/shop"
            className="flex min-h-12 items-center justify-center rounded-[16px] border border-[#EAEAEA] bg-white text-sm font-bold text-[#153E73]"
          >
            回到商城首頁
          </Link>
        </div>
      </main>
    </div>
  );
}
