"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, ShoppingCart, User } from "lucide-react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import { AppHamburgerMenu } from "@/components/layout/AppHamburgerMenu";
import { useCart } from "@/hooks/useCart";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";
import { cn } from "@/lib/utils";

const SHOP_HEADER_NAV = [
  { href: APP_ROUTES.home, label: "首頁" },
  { href: APP_ROUTES.shopCategories, label: "商品分類" },
  { href: "/themes", label: "品牌館" },
  { href: "/news", label: "最新活動" },
  { href: APP_ROUTES.recipes, label: "食譜專區" },
  { href: APP_ROUTES.articles, label: "部落格" },
] as const;

/**
 * Shop storefront header — sits ABOVE hero (never overlays).
 * Shares the same #FFE149 plane as Hero; no divider line.
 */
export function ShopHeader({
  settings: settingsProp,
}: {
  settings?: ShopPageSettings;
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

  const bg = settings.header_bg_color || DEFAULT_SHOP_PAGE_SETTINGS.header_bg_color;
  const border = settings.header_border_color;

  return (
    <header
      className={cn("sticky top-0 z-50 w-full shrink-0 rounded-none")}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        backgroundColor: bg,
        borderBottom: border ? `1px solid ${border}` : "none",
      }}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 md:h-[76px] md:gap-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-2">
          <AppHamburgerMenu />
          <ChimeidiyLogo
            variant="shopHeader"
            href={APP_ROUTES.shop}
            priority
            className="bg-transparent"
          />
          <span className="hidden rounded-full border border-[#153E73]/20 bg-transparent px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#153E73] sm:inline-flex md:text-xs">
            Lifestyle
          </span>
        </div>

        <nav
          className="hidden min-w-0 flex-[1.4] items-center justify-center gap-1 lg:flex"
          aria-label="商城導覽"
        >
          {SHOP_HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-[#153E73] transition hover:bg-black/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            href={APP_ROUTES.memberNotifications}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#153E73] transition hover:bg-black/5 md:h-11 md:w-11"
            aria-label="通知"
          >
            <Bell className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
          </Link>
          <Link
            href={APP_ROUTES.cart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#153E73] transition hover:bg-black/5 md:h-11 md:w-11"
            aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件商品` : ""}`}
          >
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
            {cartCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#F0645A] px-1 text-[10px] font-bold leading-none text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/shop/search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#153E73] transition hover:bg-black/5 md:h-11 md:w-11"
            aria-label="搜尋"
          >
            <Search className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
          </Link>
          <Link
            href={APP_ROUTES.member}
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-[#153E73] transition hover:bg-black/5 sm:inline-flex md:h-11 md:w-11"
            aria-label="會員入口"
          >
            <User className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
