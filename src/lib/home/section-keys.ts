/** Canonical homepage CMS section keys (homepage_blocks.block_key). */

export type HomeSectionKey =
  | "hot_searches"
  | "hero"
  | "brand_statement"
  | "quick_menu"
  | "ai_assistant"
  | "baking_inspiration"
  | "popular_categories"
  | "latest_recipes"
  | "weekly_new_products"
  | "popular_baking_products"
  | "chime_select"
  | "weekly_live_streams"
  | "closing_group_buys"
  | "weekly_promotions"
  | "monthly_challenge"
  | "seasonal_themes"
  | "latest_videos"
  | "store_information"
  | "latest_articles";

export const HOME_SECTION_KEYS: HomeSectionKey[] = [
  "hot_searches",
  "hero",
  "brand_statement",
  "quick_menu",
  "ai_assistant",
  "baking_inspiration",
  "popular_categories",
  "latest_recipes",
  "weekly_new_products",
  "popular_baking_products",
  "chime_select",
  "weekly_live_streams",
  "closing_group_buys",
  "weekly_promotions",
  "monthly_challenge",
  "seasonal_themes",
  "latest_videos",
  "store_information",
  "latest_articles",
];

/** Cream top band (search sits above CMS-driven sections). */
export const CREAM_ZONE_KEYS: HomeSectionKey[] = [
  "hot_searches",
  "hero",
  "brand_statement",
  "quick_menu",
];

export const HOME_SECTION_SORT_DEFAULT: Record<HomeSectionKey, number> = {
  hot_searches: 10,
  hero: 20,
  brand_statement: 30,
  quick_menu: 40,
  ai_assistant: 50,
  baking_inspiration: 60,
  popular_categories: 70,
  latest_recipes: 80,
  weekly_new_products: 90,
  popular_baking_products: 100,
  chime_select: 110,
  weekly_live_streams: 120,
  closing_group_buys: 130,
  weekly_promotions: 140,
  monthly_challenge: 150,
  seasonal_themes: 160,
  latest_videos: 170,
  store_information: 180,
  latest_articles: 190,
};

export function isHomeSectionKey(value: string): value is HomeSectionKey {
  return (HOME_SECTION_KEYS as string[]).includes(value);
}
