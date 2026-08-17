"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, ShoppingCart } from "lucide-react";
import { AppHamburgerMenu } from "@/components/layout/AppHamburgerMenu";
import { useCart } from "@/hooks/useCart";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";
import { cn } from "@/lib/utils";

const GLASS_BTN =
  "shop-header-glass inline-flex h-11 w-11 shrink-0 items-center justify-center text-[#153E73] transition hover:brightness-[1.02] active:scale-[0.98]";

/**
 * Hub header — sits above hero on the yellow plane (no absolute overlap).
 * Used by shop hub and group-buy hub (title / search target differ).
 */
export function ShopHeader({
  settings: settingsProp,
  title = "商城",
  searchHref = "/shop/search",
  showSearch = true,
}: {
  settings?: ShopPageSettings;
  title?: string;
  /** Header search icon destination (shop search or page-local focus). */
  searchHref?: string;
  /** Shop hub hides this — a full search bar sits in the welcome section. */
  showSearch?: boolean;
}) {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
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

  void settings; // kept for future CMS header color hooks

  return (
    <header
      className="shop-header-bar relative z-30 w-full shrink-0"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <div className="mx-auto flex h-[56px] w-full max-w-[1440px] items-center gap-2 px-[15px] pb-2 md:h-[60px] md:px-6">
        <div className="flex flex-1 items-center justify-start">
          <AppHamburgerMenu className={cn(GLASS_BTN, "!min-h-0 !min-w-0 !rounded-full")} />
        </div>

        <h1 className="shrink-0 text-[17px] font-bold tracking-wide text-[#153E73] md:text-lg">
          {title}
        </h1>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Link
            href={APP_ROUTES.memberNotifications}
            className={GLASS_BTN}
            aria-label="通知"
          >
            <Bell className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href={APP_ROUTES.cart}
            className={cn(GLASS_BTN, "relative")}
            aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件商品` : ""}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            {cartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#F0645A] px-1 text-[10px] font-bold leading-none text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          {showSearch ? (
            <Link href={searchHref} className={GLASS_BTN} aria-label="搜尋">
              <Search className="h-5 w-5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
