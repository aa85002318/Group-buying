/** Canonical homepage CMS section keys (homepage_blocks.block_key = type). */

export type HomeSectionKey =
  | "hero"
  | "latest_campaigns"
  | "store_news"
  | "hot_searches"
  | "latest_recipes"
  | "recipe_kits"
  | "popular_categories"
  | "popular_baking_products"
  | "product_series"
  | "featured_courses"
  | "weekly_group_buys"
  | "closing_group_buys"
  | "latest_videos"
  | "service_shortcuts"
  | "trust_services"
  | "brand_statement"
  | "quick_menu"
  | "ai_assistant"
  | "baking_inspiration"
  | "weekly_new_products"
  | "chime_select"
  | "weekly_live_streams"
  | "weekly_promotions"
  | "banner_strip"
  | "monthly_challenge"
  | "seasonal_themes"
  | "store_information"
  | "latest_articles"
  | "ingredient_categories"
  | "ingredient_shop"
  | "quick_entry"
  | "group_buy_banner"
  // Free-form blocks editors can add any number of times (CMS step ③).
  | "custom_banner"
  | "custom_products"
  | "custom_text";

/** Blocks that may appear many times and are rendered by the website home. */
export const CUSTOM_HOME_BLOCK_KEYS = ["custom_banner", "custom_products", "custom_text"] as const;
export type CustomHomeBlockKey = (typeof CUSTOM_HOME_BLOCK_KEYS)[number];
export function isCustomHomeBlockKey(key: string): key is CustomHomeBlockKey {
  return (CUSTOM_HOME_BLOCK_KEYS as readonly string[]).includes(key);
}

/**
 * Canonical live homepage stack (admin catalog order).
 * Matches front-of-house composition under Hero.
 */
export const PRIMARY_HOME_SECTION_KEYS: HomeSectionKey[] = [
  "hero",
  "latest_campaigns",
  "quick_entry",
  "latest_recipes",
  "ingredient_shop",
  "group_buy_banner",
  "weekly_group_buys",
  "closing_group_buys",
  "weekly_live_streams",
  "chime_select",
  "service_shortcuts",
];

export const HOME_SECTION_KEYS: HomeSectionKey[] = [
  ...PRIMARY_HOME_SECTION_KEYS,
  "store_news",
  "recipe_kits",
  "popular_categories",
  "ingredient_categories",
  "popular_baking_products",
  "hot_searches",
  "product_series",
  "featured_courses",
  "latest_videos",
  "trust_services",
  "brand_statement",
  "quick_menu",
  "ai_assistant",
  "baking_inspiration",
  "weekly_new_products",
  "weekly_promotions",
  "banner_strip",
  "monthly_challenge",
  "seasonal_themes",
  "store_information",
  "latest_articles",
  "custom_banner",
  "custom_products",
  "custom_text",
];

/** At most one instance of these types on the homepage. */
export const HOME_SECTION_SINGLETONS = new Set<HomeSectionKey>([
  "hero",
  "latest_campaigns",
  "store_news",
  "hot_searches",
  "quick_entry",
  "brand_statement",
  "quick_menu",
  "ai_assistant",
  "service_shortcuts",
  "trust_services",
  "store_information",
  "ingredient_shop",
  "group_buy_banner",
  "weekly_group_buys",
  "closing_group_buys",
  "weekly_live_streams",
  "chime_select",
  "latest_recipes",
]);

/**
 * Full-bleed / edge-to-edge zone — rendered outside padded HomeContentArea.
 * Includes hero + primary stack so CMS order controls the main page.
 */
export const CREAM_ZONE_KEYS: HomeSectionKey[] = [...PRIMARY_HOME_SECTION_KEYS];

/** Spec default order for the primary architecture. */
export const HOME_SECTION_SORT_DEFAULT: Record<HomeSectionKey, number> = {
  hero: 10,
  latest_campaigns: 15,
  quick_entry: 20,
  latest_recipes: 30,
  ingredient_shop: 40,
  group_buy_banner: 50,
  weekly_group_buys: 60,
  closing_group_buys: 70,
  weekly_live_streams: 80,
  chime_select: 90,
  service_shortcuts: 100,
  store_news: 110,
  recipe_kits: 120,
  popular_categories: 130,
  ingredient_categories: 140,
  popular_baking_products: 150,
  hot_searches: 160,
  product_series: 170,
  featured_courses: 180,
  latest_videos: 190,
  trust_services: 200,
  brand_statement: 210,
  quick_menu: 220,
  ai_assistant: 230,
  baking_inspiration: 240,
  weekly_new_products: 250,
  weekly_promotions: 260,
  banner_strip: 270,
  monthly_challenge: 280,
  seasonal_themes: 290,
  store_information: 300,
  custom_banner: 400,
  custom_products: 410,
  custom_text: 420,
  latest_articles: 310,
};

export function isHomeSectionKey(value: string): value is HomeSectionKey {
  return (HOME_SECTION_KEYS as string[]).includes(value);
}

export function isSingletonHomeSection(key: HomeSectionKey): boolean {
  return HOME_SECTION_SINGLETONS.has(key);
}

/* ------------------------------------------------------------------ */
/* Website home (one responsive layout for phone / tablet / computer). */
/* Order follows the approved 首頁效果圖.                              */
/* ------------------------------------------------------------------ */

export const WEBSITE_HOME_SECTION_KEYS: HomeSectionKey[] = [
  "hero",
  "hot_searches",
  "popular_categories",
  "latest_campaigns",
  "popular_baking_products",
  "weekly_new_products",
  "brand_statement",
  "latest_recipes",
  "ingredient_shop",
  "ai_assistant",
  "store_information",
  "service_shortcuts",
  "quick_entry",
  "group_buy_banner",
  "weekly_group_buys",
  "closing_group_buys",
  "weekly_live_streams",
  "chime_select",
];

/**
 * A stored home layout that contains any of these keys was saved with the
 * new website layout (後台「套用新版首頁排版」). Older layouts are shown in
 * the new order automatically until an editor applies it.
 */
export const WEBSITE_HOME_V2_MARKER_KEYS = new Set<string>([
  "hot_searches",
  "popular_categories",
  "popular_baking_products",
  "weekly_new_products",
  "ai_assistant",
  "store_information",
  "brand_statement",
]);

/** Shown in the list but off on the website until an editor turns it on. */
export const WEBSITE_HOME_OFF_BY_DEFAULT = new Set<string>(["quick_entry"]);

/** Titles used when a website block is created for the first time. */
export const WEBSITE_HOME_TITLES: Partial<Record<HomeSectionKey, string>> = {
  hot_searches: "搜尋列與熱門搜尋",
  popular_categories: "商品分類",
  popular_baking_products: "熱門商品",
  weekly_new_products: "新品上架",
  brand_statement: "烘焙，不只是買材料",
  ai_assistant: "AI 烘焙小幫手",
  store_information: "大安門市與企業採購",
  service_shortcuts: "快捷服務",
};
