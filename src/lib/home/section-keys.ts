/** Canonical homepage CMS section keys (homepage_blocks.block_key = type). */

export type HomeSectionKey =
  | "hero"
  | "store_news"
  | "hot_searches"
  | "latest_recipes"
  | "recipe_kits"
  | "popular_categories"
  | "popular_baking_products"
  | "product_series"
  | "featured_courses"
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
  | "ingredient_shop";

/** Primary homepage architecture (spec order 1–8). */
export const PRIMARY_HOME_SECTION_KEYS: HomeSectionKey[] = [
  "hero",
  "store_news",
  "latest_recipes",
  "recipe_kits",
  "popular_categories",
  "ingredient_categories",
  "ingredient_shop",
  "popular_baking_products",
  "closing_group_buys",
  "service_shortcuts",
];

export const HOME_SECTION_KEYS: HomeSectionKey[] = [
  ...PRIMARY_HOME_SECTION_KEYS,
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
  "chime_select",
  "weekly_live_streams",
  "weekly_promotions",
  "banner_strip",
  "monthly_challenge",
  "seasonal_themes",
  "store_information",
  "latest_articles",
];

/** At most one instance of these types on the homepage. */
export const HOME_SECTION_SINGLETONS = new Set<HomeSectionKey>([
  "hero",
  "store_news",
  "hot_searches",
  "brand_statement",
  "quick_menu",
  "ai_assistant",
  "service_shortcuts",
  "trust_services",
  "store_information",
]);

/** Cream top band — Hero only (search lives inside BrandHero). */
export const CREAM_ZONE_KEYS: HomeSectionKey[] = ["hero"];

/** Spec default order for the primary architecture. */
export const HOME_SECTION_SORT_DEFAULT: Record<HomeSectionKey, number> = {
  hero: 10,
  store_news: 20,
  latest_recipes: 30,
  recipe_kits: 40,
  popular_categories: 50,
  popular_baking_products: 60,
  closing_group_buys: 70,
  service_shortcuts: 80,
  hot_searches: 90,
  product_series: 95,
  featured_courses: 100,
  latest_videos: 110,
  trust_services: 120,
  brand_statement: 130,
  quick_menu: 140,
  ai_assistant: 150,
  baking_inspiration: 160,
  weekly_new_products: 170,
  chime_select: 180,
  weekly_live_streams: 190,
  weekly_promotions: 200,
  banner_strip: 205,
  monthly_challenge: 210,
  seasonal_themes: 220,
  store_information: 230,
  latest_articles: 240,
  ingredient_categories: 45,
  ingredient_shop: 48,
};

export function isHomeSectionKey(value: string): value is HomeSectionKey {
  return (HOME_SECTION_KEYS as string[]).includes(value);
}

export function isSingletonHomeSection(key: HomeSectionKey): boolean {
  return HOME_SECTION_SINGLETONS.has(key);
}
