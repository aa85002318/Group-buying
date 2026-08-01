"use client";

import { useEffect, useState } from "react";
import { HeroTopActions } from "@/components/home/HeroTopActions";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";

/**
 * Shop hub top bar — same size/layout as homepage HeroTopActions
 * (circular frosted icons on a yellow band above the banner, not sticky logo chrome).
 */
export function ShopHeader({
  settings: settingsProp,
  onSearchClick,
}: {
  settings?: ShopPageSettings;
  onSearchClick: () => void;
}) {
  const [settings, setSettings] = useState<ShopPageSettings>(
    settingsProp ?? DEFAULT_SHOP_PAGE_SETTINGS
  );

  useEffect(() => {
    if (settingsProp) {
      setSettings(settingsProp);
      return;
    }
    let cancelled = false;
    fetch("/api/shop/page-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.settings) return;
        setSettings(d.settings as ShopPageSettings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [settingsProp]);

  const bg = settings.header_bg_color || DEFAULT_SHOP_PAGE_SETTINGS.header_bg_color;

  return (
    <div className="shop-hero-top-bar" style={{ backgroundColor: bg }}>
      <HeroTopActions onSearchClick={onSearchClick} />
    </div>
  );
}
