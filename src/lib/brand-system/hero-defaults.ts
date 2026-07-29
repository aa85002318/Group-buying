import type { BrandHeroData, BrandHeroKey } from "@/components/brand/hero/types";

export const BRAND_HERO_DEFAULTS: Record<BrandHeroKey, BrandHeroData> = {
  home: {
    heroKey: "home",
    title: "今天想做什麼？",
    subtitle: "從食譜開始，輕鬆完成每一個烘焙時刻",
    showTitle: true,
    showSubtitle: true,
    imagePosition: "center",
    searchPlaceholder: "搜尋食譜、材料、商品、課程……",
    searchScope: "global",
    showPopularTags: true,
    tags: [
      { id: "t1", label: "草莓蛋糕", keyword: "草莓蛋糕", sortOrder: 10 },
      { id: "t2", label: "司康", keyword: "司康", sortOrder: 20 },
      { id: "t3", label: "生乳捲", keyword: "生乳捲", sortOrder: 30 },
      { id: "t4", label: "巧克力餅乾", keyword: "巧克力餅乾", sortOrder: 40 },
      { id: "t5", label: "可頌", keyword: "可頌", sortOrder: 50 },
    ],
  },
  recipes: {
    heroKey: "recipes",
    title: "找食譜",
    subtitle: "跟著老師一步步完成",
    searchPlaceholder: "搜尋食譜名稱或材料…",
    searchScope: "recipes",
  },
  products: {
    heroKey: "products",
    title: "找材料",
    subtitle: "嚴選烘焙原料與器具",
    searchPlaceholder: "搜尋商品名稱…",
    searchScope: "products",
  },
  courses: {
    heroKey: "courses",
    title: "烘焙課程",
    subtitle: "跟老師一起做",
    searchPlaceholder: "搜尋課程…",
    searchScope: "courses",
  },
  "group-buy": {
    heroKey: "group-buy",
    title: "團購優惠",
    subtitle: "好料一起買更划算",
    searchPlaceholder: "搜尋團購活動…",
    searchScope: "group_buy",
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
