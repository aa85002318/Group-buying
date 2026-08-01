"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopHeroBanner } from "@/components/shop/ShopHeroBanner";
import { ShopSearchBar } from "@/components/shop/ShopSearchBar";
import { ShopMainCategoryMenu } from "@/components/shop/ShopMainCategoryMenu";
import { ShopPromoCarousel } from "@/components/shop/ShopPromoCarousel";
import { PopularProducts } from "@/components/shop/PopularProducts";
import { ShopFeatureBlocks } from "@/components/shop/ShopFeatureBlocks";
import { ShopNewProducts } from "@/components/shop/ShopNewProducts";
import { ShopOrderingInfo } from "@/components/shop/ShopOrderingInfo";
import { ShopCorporateInquiry } from "@/components/shop/ShopCorporateInquiry";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";

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

  const brandYellow =
    pageSettings.header_bg_color || DEFAULT_SHOP_PAGE_SETTINGS.header_bg_color;

  return (
    <div className="shop-hub space-y-0 bg-white">
      <div className="w-full max-w-none rounded-none" style={{ backgroundColor: brandYellow }}>
        <ShopHeader settings={pageSettings} />
        <ShopHeroBanner
          backgroundColor={
            pageSettings.hero_bg_color || pageSettings.header_bg_color
          }
        />
      </div>

      <main>
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6 md:pt-5">
            <ShopSearchBar />
          </div>
        </div>

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
