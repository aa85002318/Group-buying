/** Canonical homepage CMS section keys (homepage_blocks.block_key). */

export type HomeSectionKey =
  | "hero"
  | "hot_searches"
  | "latest_recipes"
  | "recipe_kits"
  | "popular_categories"
  | "popular_baking_products"
  | "featured_courses"
  | "closing_group_buys"
  | "latest_videos"
  | "trust_services"
  | "brand_statement"
  | "quick_menu"
  | "ai_assistant"
  | "baking_inspiration"
  | "weekly_new_products"
  | "chime_select"
  | "weekly_live_streams"
  | "weekly_promotions"
  | "monthly_challenge"
  | "seasonal_themes"
  | "store_information"
  | "latest_articles";

export const HOME_SECTION_KEYS: HomeSectionKey[] = [
  "hero",
  "hot_searches",
  "latest_recipes",
  "recipe_kits",
  "popular_categories",
  "popular_baking_products",
  "featured_courses",
  "closing_group_buys",
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
  "monthly_challenge",
  "seasonal_themes",
  "store_information",
  "latest_articles",
];

/** Cream top band (search sits above CMS-driven sections). */
export const CREAM_ZONE_KEYS: HomeSectionKey[] = [
  "hero",
  "hot_searches",
];

/** Spec default order for the primary architecture (1–10). */
export const HOME_SECTION_SORT_DEFAULT: Record<HomeSectionKey, number> = {
  hero: 10,
  hot_searches: 20,
  latest_recipes: 30,
  recipe_kits: 40,
  popular_categories: 50,
  popular_baking_products: 60,
  featured_courses: 70,
  closing_group_buys: 80,
  latest_videos: 90,
  trust_services: 100,
  brand_statement: 110,
  quick_menu: 120,
  ai_assistant: 130,
  baking_inspiration: 140,
  weekly_new_products: 150,
  chime_select: 160,
  weekly_live_streams: 170,
  weekly_promotions: 180,
  monthly_challenge: 190,
  seasonal_themes: 200,
  store_information: 210,
  latest_articles: 220,
};

export function isHomeSectionKey(value: string): value is HomeSectionKey {
  return (HOME_SECTION_KEYS as string[]).includes(value);
}
