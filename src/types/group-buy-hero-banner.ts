/** Group-buy hub hero — mirrors staging homepage hero chrome & assets. */

import {
  HOME_HERO_DESKTOP_HEIGHT,
  HOME_HERO_DESKTOP_WIDTH,
  HOME_HERO_MOBILE_HEIGHT,
  HOME_HERO_MOBILE_WIDTH,
  HOME_HERO_DEFAULTS,
} from "@/types/home-hero";

/** Same dimensions as homepage (`/` on staging): desktop 1024×479, mobile 885×917. */
export const GROUP_BUY_HERO_DESKTOP_WIDTH = HOME_HERO_DESKTOP_WIDTH;
export const GROUP_BUY_HERO_DESKTOP_HEIGHT = HOME_HERO_DESKTOP_HEIGHT;
export const GROUP_BUY_HERO_MOBILE_WIDTH = HOME_HERO_MOBILE_WIDTH;
export const GROUP_BUY_HERO_MOBILE_HEIGHT = HOME_HERO_MOBILE_HEIGHT;

/**
 * Copied from staging homepage hero art (`/brand/hero-home-*.png`).
 * Kept under /images/group-buy so the hub owns a snapshot of the home look.
 */
export const DEFAULT_GROUP_BUY_HERO = {
  title: "團購優惠",
  alt_text: "CHIMEIDIY 人氣好物團購主視覺",
  desktop_image: "/images/group-buy/hero-desktop.png?v=20260805a",
  mobile_image: "/images/group-buy/hero-mobile.png?v=20260805a",
  link: "/group-buy",
  searchPlaceholder:
    HOME_HERO_DEFAULTS.searchPlaceholder ||
    "今天想做什麼？搜尋食譜、商品、團購、生鮮…",
} as const;

/** Brand yellow — same as homepage `.home-hero` (#FDE045). */
export const GROUP_BUY_BRAND_YELLOW = "#FDE045";
