import { DEFAULT_RECIPE_HERO_DESKTOP } from "@/lib/recipes/page-settings";

/**
 * Unified page hero banners (every page except the home page).
 * Image + link only — no text on the banner. Stored in cms_banners with
 * placement = `page_hero_<key>`; managed at /admin/page-heroes.
 */
export const PAGE_HERO_SIZE = {
  desktop: { width: 1920, height: 640, ratio: "3:1" },
  mobile: { width: 1080, height: 720, ratio: "3:2" },
} as const;

export type PageHeroKey =
  | "shop"
  | "recipes"
  | "activities"
  | "brands"
  | "ai"
  | "stores"
  | "member"
  | "group_buy";

export type PageHeroPage = {
  key: PageHeroKey;
  label: string;
  path: string;
  /** Shown until the first banner is uploaded. null = no hero until uploaded. */
  fallbackImage: string | null;
};

export const PAGE_HERO_PAGES: PageHeroPage[] = [
  { key: "shop", label: "商城", path: "/shop", fallbackImage: "/images/shop/hero-desktop.jpg" },
  { key: "recipes", label: "食譜", path: "/recipes", fallbackImage: DEFAULT_RECIPE_HERO_DESKTOP },
  {
    key: "activities",
    label: "最新活動",
    path: "/activities",
    fallbackImage: "/images/home/latest-campaigns/01-free-shipping.jpg",
  },
  {
    key: "brands",
    label: "品牌專區",
    path: "/themes",
    fallbackImage: "/images/home/group-buy-banner/slide-season.png",
  },
  { key: "ai", label: "AI 助手", path: "/ai", fallbackImage: "/brand/hero-ai-banner.jpg" },
  { key: "stores", label: "門市資訊", path: "/stores", fallbackImage: null },
  { key: "member", label: "會員中心", path: "/member", fallbackImage: null },
  { key: "group_buy", label: "團購", path: "/group-buy", fallbackImage: null },
];

export function pageHeroPlacement(key: PageHeroKey) {
  return `page_hero_${key}`;
}

export function getPageHeroPage(key: PageHeroKey) {
  return PAGE_HERO_PAGES.find((p) => p.key === key) ?? null;
}
