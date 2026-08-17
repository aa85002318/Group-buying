"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopHomeTopBand } from "@/components/shop/ShopHomeTopBand";
import { ShopMainCategoryMenu } from "@/components/shop/ShopMainCategoryMenu";
import { ShopPromoCarousel } from "@/components/shop/ShopPromoCarousel";
import { PopularProducts } from "@/components/shop/PopularProducts";
import { ShopFeatureBlocks } from "@/components/shop/ShopFeatureBlocks";
import { ShopNewProducts } from "@/components/shop/ShopNewProducts";
import { ShopSaleProducts } from "@/components/shop/ShopSaleProducts";
import { ShopBundleProducts } from "@/components/shop/ShopBundleProducts";
import { ShopFeaturedProducts } from "@/components/shop/ShopFeaturedProducts";
import { ShopInspirationWall } from "@/components/shop/ShopInspirationWall";
import { ShopAiRecipeAssistant } from "@/components/shop/ShopAiRecipeAssistant";
import { ShopOrderingInfo } from "@/components/shop/ShopOrderingInfo";
import { ShopCorporateInquiry } from "@/components/shop/ShopCorporateInquiry";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";
import {
  DEFAULT_SHOP_HOME_SETTINGS,
  DEFAULT_SHOP_PRODUCT_BLOCKS,
  SHOP_WELCOME_YELLOW,
  type ShopHomeSettings,
  type ShopProductBlockSettings,
} from "@/lib/shop/home-settings";
import {
  DEFAULT_SHOP_LAYOUT,
  mergeShopLayoutSettings,
  type ShopLayoutSectionId,
  type ShopLayoutSettings,
} from "@/lib/shop/layout-settings";

/** Older CMS yellows → unify to shop welcome yellow (#FFD454). */
const LEGACY_SHOP_YELLOWS = new Set([
  "#FEDB49",
  "#FCCA30",
  "#FFD84D",
  "#FFE149",
  "#FDE045",
]);

type ProductBlocks = Record<
  "new" | "popular" | "sale" | "bundle" | "featured",
  ShopProductBlockSettings
>;

function resolvePlaneYellow(settings: ShopPageSettings, welcomeYellow?: string) {
  const welcome = (welcomeYellow || "").toUpperCase();
  if (welcome && !LEGACY_SHOP_YELLOWS.has(welcome)) return welcome;
  const header = (settings.header_bg_color || "").toUpperCase();
  if (!header || LEGACY_SHOP_YELLOWS.has(header)) return SHOP_WELCOME_YELLOW;
  return header;
}

function renderSection(id: ShopLayoutSectionId, blocks: ProductBlocks) {
  switch (id) {
    case "categories":
      return <ShopMainCategoryMenu key={id} />;
    case "features":
      return <ShopFeatureBlocks key={id} />;
    case "promo":
      return <ShopPromoCarousel key={id} />;
    case "new":
      if (!blocks.new.visible) return null;
      return (
        <ShopNewProducts key={id} title={blocks.new.title} limit={blocks.new.limit} />
      );
    case "popular":
      if (!blocks.popular.visible) return null;
      return (
        <PopularProducts
          key={id}
          title={blocks.popular.title}
          limit={blocks.popular.limit}
        />
      );
    case "sale":
      if (!blocks.sale.visible) return null;
      return (
        <ShopSaleProducts key={id} title={blocks.sale.title} limit={blocks.sale.limit} />
      );
    case "bundle":
      if (!blocks.bundle.visible) return null;
      return (
        <ShopBundleProducts
          key={id}
          title={blocks.bundle.title}
          limit={blocks.bundle.limit}
        />
      );
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
 * Shop hub Version C — search, quick links, categories, then 16:9 promo
 * and product rails: 本週上新 → 熱門 → 優惠 → 組合優惠.
 */
export function ShopHubClient() {
  const [layout, setLayout] = useState<ShopLayoutSettings>(DEFAULT_SHOP_LAYOUT);
  const [homeSettings, setHomeSettings] = useState<ShopHomeSettings>(
    DEFAULT_SHOP_HOME_SETTINGS
  );

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

    fetch("/api/shop/home-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.settings) setHomeSettings(d.settings as ShopHomeSettings);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const pageSettings = layout.appearance ?? DEFAULT_SHOP_PAGE_SETTINGS;
  const planeYellow = resolvePlaneYellow(
    pageSettings,
    homeSettings.welcome_background_color
  );
  const unifiedSettings: ShopPageSettings = {
    ...pageSettings,
    header_bg_color: planeYellow,
    hero_bg_color: planeYellow,
    header_border_color: null,
  };

  const productBlocks: ProductBlocks = {
    ...DEFAULT_SHOP_PRODUCT_BLOCKS,
    ...(homeSettings.product_blocks ?? {}),
  };

  const mainSections = useMemo(() => {
    return layout.sectionOrder.filter(
      (id) => id !== "hero" && layout.sections[id] !== false
    );
  }, [layout]);

  const lastProductRail = useMemo(() => {
    const rails: ShopLayoutSectionId[] = ["bundle", "sale", "popular", "new"];
    return rails.find((id) => mainSections.includes(id)) ?? null;
  }, [mainSections]);

  return (
    <div className="shop-hub space-y-0 bg-[#FFFEFA]">
      <div
        className="shop-hub-hero-plane w-full max-w-none"
        style={{ backgroundColor: planeYellow }}
      >
        <ShopHeader
          settings={unifiedSettings}
          title={homeSettings.shop_title || "商城"}
          showSearch={false}
        />
        <ShopHomeTopBand backgroundColor={planeYellow} settings={homeSettings} />
      </div>

      <main className="shop-hub-main flex flex-col gap-[20px] bg-[#FFFEFA] pb-[20px] pt-[20px]">
        {mainSections.map((id) => (
          <div key={id} className="contents">
            {renderSection(id, productBlocks)}
            {id === lastProductRail && productBlocks.featured.visible ? (
              <ShopFeaturedProducts
                title={productBlocks.featured.title}
                limit={productBlocks.featured.limit}
              />
            ) : null}
          </div>
        ))}

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
