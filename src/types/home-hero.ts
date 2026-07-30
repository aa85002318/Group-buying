export type HomeHeroObjectPosition =
  | "center"
  | "center left"
  | "center right"
  | "top"
  | "center top";

export type HomeHeroTag = {
  id: string;
  label: string;
  keyword?: string | null;
  linkType?: "search" | "url";
  targetUrl?: string | null;
  enabled?: boolean;
  sortOrder?: number;
};

export type HomeHeroData = {
  title: string;
  description?: string | null;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  imageAlt?: string | null;
  desktopObjectPosition?: HomeHeroObjectPosition;
  mobileObjectPosition?: HomeHeroObjectPosition;
  searchPlaceholder?: string | null;
  searchScope?: string;
  showPopularTags?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  tags?: HomeHeroTag[];
  enabled?: boolean;
};

export const HOME_HERO_DESKTOP_IMAGE = "/brand/hero-home-desktop.png?v=20260730h";
export const HOME_HERO_MOBILE_IMAGE = "/brand/hero-home-mobile.png?v=20260730h";

/** Trimmed desktop asset ≈ 1024×479 */
export const HOME_HERO_DESKTOP_ASPECT = "1024 / 479";
/** Mobile asset (wave trimmed) ≈ 1024×701 */
export const HOME_HERO_MOBILE_ASPECT = "1024 / 701";
export const HOME_HERO_MOBILE_WIDTH = 1024;
export const HOME_HERO_MOBILE_HEIGHT = 701;

export const HOME_HERO_DEFAULTS: HomeHeroData = {
  title: "今天想做點什麼？",
  description: "探索食譜、團購、生鮮、居家好物\n讓每一天的生活更簡單。",
  desktopImageUrl: HOME_HERO_DESKTOP_IMAGE,
  mobileImageUrl: HOME_HERO_MOBILE_IMAGE,
  imageAlt: "CHIMEiDIY Lifestyle 首頁主視覺",
  desktopObjectPosition: "center",
  mobileObjectPosition: "center top",
  searchPlaceholder: "今天想做什麼？搜尋食譜、商品、團購、生鮮…",
  searchScope: "global",
  showPopularTags: true,
  // Banner art already includes copy — hide overlays by default
  showTitle: false,
  showDescription: false,
  tags: [
    { id: "t1", label: "🥐 佛卡夏", keyword: "佛卡夏", sortOrder: 10 },
    { id: "t2", label: "🍪 餅乾", keyword: "餅乾", sortOrder: 20 },
    { id: "t3", label: "🍰 蛋糕", keyword: "蛋糕", sortOrder: 30 },
    { id: "t4", label: "🧈 奶油乳酪", keyword: "奶油乳酪", sortOrder: 40 },
    { id: "t5", label: "🛒 團購", keyword: "團購", sortOrder: 50 },
    { id: "t6", label: "🥬 生鮮", keyword: "生鮮", sortOrder: 60 },
    {
      id: "more",
      label: "更多",
      keyword: "__more__",
      linkType: "url",
      targetUrl: "/products",
      sortOrder: 70,
    },
  ],
};
