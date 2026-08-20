"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SHOP_HOME_SETTINGS,
  type ShopHomeSettings,
  type ShopPopularKeyword,
} from "@/lib/shop/home-settings";
import { ShopSearchBar } from "@/components/shop/ShopSearchBar";
import { ShopPopularKeywords } from "@/components/shop/ShopPopularKeywords";
import { ShopQuickLinks } from "@/components/shop/ShopQuickLinks";

/**
 * Version C yellow plane under the shop header: search → keywords → 4 quick links.
 * No large hero, mascot, or welcome copy.
 */
export function ShopHomeTopBand({
  backgroundColor,
  settings: settingsProp,
}: {
  backgroundColor?: string;
  settings?: ShopHomeSettings;
}) {
  const [settings, setSettings] = useState<ShopHomeSettings>(
    settingsProp ?? DEFAULT_SHOP_HOME_SETTINGS
  );
  const [keywords, setKeywords] = useState<ShopPopularKeyword[]>([]);

  useEffect(() => {
    if (settingsProp) setSettings(settingsProp);
  }, [settingsProp]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/home-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!settingsProp && d.settings) setSettings(d.settings as ShopHomeSettings);
        if (Array.isArray(d.keywords)) setKeywords(d.keywords as ShopPopularKeyword[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [settingsProp]);

  const bg = backgroundColor || settings.welcome_background_color;

  return (
    <section
      className="shop-home-top-band relative w-full pb-4"
      style={{ backgroundColor: bg }}
      aria-label="商城搜尋與快捷入口"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
        <ShopSearchBar placeholder={settings.search_placeholder} seam={false} />
        {settings.show_popular_keywords ? <ShopPopularKeywords keywords={keywords} /> : null}
      </div>
      <div className="mt-3">
        <ShopQuickLinks />
      </div>
    </section>
  );
}
