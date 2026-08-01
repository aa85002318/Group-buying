"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopHeroBanner } from "@/components/shop/ShopHeroBanner";
import {
  ShopSearchBar,
  type ShopSearchBarHandle,
} from "@/components/shop/ShopSearchBar";
import { ShopMainCategoryMenu } from "@/components/shop/ShopMainCategoryMenu";
import { ShopPromoCarousel } from "@/components/shop/ShopPromoCarousel";
import { PopularProducts } from "@/components/shop/PopularProducts";
import { ShopFeatureBlocks } from "@/components/shop/ShopFeatureBlocks";
import { ShopNewProducts } from "@/components/shop/ShopNewProducts";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";

export function ShopHubClient() {
  const [pageSettings, setPageSettings] = useState<ShopPageSettings>(
    DEFAULT_SHOP_PAGE_SETTINGS
  );
  const searchRef = useRef<ShopSearchBarHandle>(null);

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

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  const headerBg =
    pageSettings.header_bg_color || DEFAULT_SHOP_PAGE_SETTINGS.header_bg_color;
  const heroBg =
    pageSettings.hero_bg_color || pageSettings.header_bg_color || headerBg;

  return (
    <div className="shop-hub space-y-0 bg-white">
      {/* Same chrome stack as homepage: top bar → full-bleed hero → overlapping search */}
      <section
        className="shop-hero shop-hero-section"
        style={{ backgroundColor: headerBg }}
        aria-label="商城頁首與主視覺"
      >
        <ShopHeader settings={pageSettings} onSearchClick={focusSearch} />
        <div className="shop-hero-canvas" style={{ backgroundColor: heroBg }}>
          <ShopHeroBanner backgroundColor={heroBg} />
        </div>
        <div className="shop-hero-search-wrap">
          <ShopSearchBar ref={searchRef} />
        </div>
      </section>

      <main>
        <ShopMainCategoryMenu />

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

        <div className="shop-hub-body mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-0 md:px-6">
          <section className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/stores"
              className="rounded-[16px] border border-[#EAEAEA] bg-white p-4 text-[#153E73] shadow-[0_4px_14px_rgba(21,62,115,0.06)]"
            >
              <h3 className="font-bold">門市取貨</h3>
              <p className="mt-1 text-sm text-[#687386]">線上下單，就近門市取貨</p>
            </Link>
            <Link
              href="/corporate"
              className="rounded-[16px] border border-[#EAEAEA] bg-white p-4 text-[#153E73] shadow-[0_4px_14px_rgba(21,62,115,0.06)]"
            >
              <h3 className="font-bold">企業訂購詢問</h3>
              <p className="mt-1 text-sm text-[#687386]">大宗採購與福委方案</p>
            </Link>
          </section>

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
