import type { BrandHeroData, BrandHeroKey } from "@/components/brand/hero/types";
import {
  HOME_HERO_DESKTOP_IMAGE,
  HOME_HERO_MOBILE_IMAGE,
} from "@/types/home-hero";

export const BRAND_HERO_DEFAULTS: Record<BrandHeroKey, BrandHeroData> = {
  home: {
    heroKey: "home",
    title: "今天想做點什麼？",
    subtitle: "探索食譜、團購、生鮮、居家好物\n讓每一天的生活更簡單。",
    capsuleLabel: null,
    showTitle: false,
    showSubtitle: false,
    showCtas: false,
    primaryCtaLabel: "立即逛逛",
    primaryCtaHref: "/products",
    secondaryCtaLabel: "看看食譜",
    secondaryCtaHref: "/recipes",
    desktopImageUrl: HOME_HERO_DESKTOP_IMAGE,
    mobileImageUrl: HOME_HERO_MOBILE_IMAGE,
    imageAlt: "CHIMEiDIY Lifestyle 首頁主視覺",
    imagePosition: "center",
    searchPlaceholder: "今天想做什麼？搜尋食譜、商品、團購、生鮮…",
    searchScope: "global",
    showPopularTags: false,
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
        linkType: "url" as const,
        targetUrl: "/products",
        sortOrder: 70,
      },
    ],
  },
  recipes: {
    heroKey: "recipes",
    title: "找食譜",
    subtitle: "跟著老師一步步完成",
    showTitle: true,
    showSubtitle: true,
    searchPlaceholder: "搜尋食譜名稱或材料…",
    searchScope: "recipes",
  },
  products: {
    heroKey: "products",
    title: "找材料",
    subtitle: "嚴選烘焙原料與器具",
    showTitle: true,
    showSubtitle: true,
    searchPlaceholder: "搜尋商品名稱…",
    searchScope: "products",
  },
  courses: {
    heroKey: "courses",
    title: "烘焙課程",
    subtitle: "跟老師一起做",
    showTitle: true,
    showSubtitle: true,
    searchPlaceholder: "搜尋課程…",
    searchScope: "courses",
  },
  "group-buy": {
    heroKey: "group-buy",
    title: "團購優惠",
    subtitle: "好料一起買更划算",
    showTitle: false,
    showSubtitle: false,
    desktopImageUrl: "/images/group-buy/hero-desktop.png?v=20260802home",
    mobileImageUrl: "/images/group-buy/hero-mobile.png?v=20260802home",
    imageAlt: "CHIMEiDIY Lifestyle 團購主視覺",
    searchPlaceholder: "今天想做什麼？搜尋食譜、商品、團購、生鮮…",
    searchScope: "group_buy",
    showPopularTags: false,
  },
};

export function resolveBrandHeroFallback(heroKey: string): BrandHeroData {
  if (heroKey in BRAND_HERO_DEFAULTS) {
    return BRAND_HERO_DEFAULTS[heroKey as BrandHeroKey];
  }
  return {
    heroKey,
    title: "CHIMEIDIY",
    subtitle: "Baking Lifestyle",
    searchPlaceholder: "搜尋…",
    searchScope: "global",
  };
}
