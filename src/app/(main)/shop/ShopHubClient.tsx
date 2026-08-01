"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopHeroBanner } from "@/components/shop/ShopHeroBanner";
import { ShopMainCategoryMenu } from "@/components/shop/ShopMainCategoryMenu";
import { ShopHeroFeatureCapsules } from "@/components/shop/ShopHeroFeatureCapsules";
import { ShopPromoCarousel } from "@/components/shop/ShopPromoCarousel";
import { PopularProducts } from "@/components/shop/PopularProducts";
import { ShopFeatureBlocks } from "@/components/shop/ShopFeatureBlocks";
import { ShopNewProducts } from "@/components/shop/ShopNewProducts";
import { ShopInspirationWall } from "@/components/shop/ShopInspirationWall";
import { ShopAiBakingAssistant } from "@/components/shop/ShopAiBakingAssistant";
import { ShopOrderingInfo } from "@/components/shop/ShopOrderingInfo";
import { ShopCorporateInquiry } from "@/components/shop/ShopCorporateInquiry";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  SHOP_BRAND_YELLOW,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";

/** Older CMS yellows → unify to App hero plane. */
const LEGACY_SHOP_YELLOWS = new Set([
  "#FEDB49",
  "#FCCA30",
  "#FFD84D",
  "#FDE045",
]);

function resolvePlaneYellow(settings: ShopPageSettings) {
  const header = (settings.header_bg_color || "").toUpperCase();
  const hero = (settings.hero_bg_color || "").toUpperCase();
  if (!header || LEGACY_SHOP_YELLOWS.has(header)) return SHOP_BRAND_YELLOW;
  if (!hero || LEGACY_SHOP_YELLOWS.has(hero)) return SHOP_BRAND_YELLOW;
  return header;
}

/**
 * Shop hub layout (App home rhythm):
 * Header → Hero → floating search → categories → mall features → banner → rails
 */
export function ShopHubClient() {
  const [pageSettings, setPageSettings] = useState<ShopPageSettings>(
    DEFAULT_SHOP_PAGE_SETTINGS
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/page-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.settings) return;
        setPageSettings(d.settings as ShopPageSettings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const planeYellow = resolvePlaneYellow(pageSettings);
  const unifiedSettings: ShopPageSettings = {
    ...pageSettings,
    header_bg_color: planeYellow,
    hero_bg_color: planeYellow,
    header_border_color: null,
  };

  return (
    <div className="shop-hub space-y-0 bg-white">
      {/* Header + homepage-style hero canvas / transition / search seam */}
      <div
        className="shop-hub-hero-plane w-full max-w-none"
        style={{ backgroundColor: planeYellow }}
      >
        <ShopHeader settings={unifiedSettings} title="商城" />
        <ShopHeroBanner backgroundColor={planeYellow} />
      </div>

      <main>
        <ShopMainCategoryMenu />

        <div className="pb-5 pt-1">
          <ShopHeroFeatureCapsules />
        </div>

        <div className="pb-7 pt-0">
          <ShopPromoCarousel />
        </div>

        <div className="pb-6">
          <PopularProducts />
        </div>

        <div className="pb-6">
          <ShopFeatureBlocks />
        </div>

        <div className="pb-6">
          <ShopNewProducts />
        </div>

        <div className="pb-6">
          <ShopInspirationWall />
        </div>

        <div className="pb-6">
          <ShopAiBakingAssistant />
        </div>

        <div className="pb-6">
          <ShopOrderingInfo />
        </div>

        <div className="pb-6">
          <ShopCorporateInquiry />
        </div>

        <div className="shop-hub-body mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-0 md:px-6">
          <Link
            href={APP_ROUTES.shopCategories}
            className="flex min-h-12 items-center justify-center rounded-[16px] border border-[#EAEAEA] bg-white text-sm font-bold text-[#153E73]"
          >
            進入全部分類
          </Link>
        </div>
      </main>
    </div>
  );
}
