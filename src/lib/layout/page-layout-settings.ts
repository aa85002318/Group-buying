/**
 * Shared types for page_layout_settings (mobile / desktop UI config only).
 * Content still comes from products / recipes / banners / etc.
 */

export type LayoutPlatform = "mobile" | "desktop";

export type PageLayoutSetting = {
  id: string;
  page_key: string;
  platform: LayoutPlatform;
  section_key: string;
  enabled: boolean;
  sort_order: number;
  layout_type: string | null;
  columns: number | null;
  display_limit: number | null;
  settings_json: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type PageLayoutSettingsJson = {
  title?: string;
  showTitle?: boolean;
  showViewAll?: boolean;
  viewAllUrl?: string;
  cardStyle?: "standard" | "compact" | "large";
  imageRatio?: string;
  gap?: number;
  sectionPaddingY?: number;
  heroRatio?: "5:2" | "16:9" | "custom";
  heroMaxHeight?: number;
  focusPosition?: "center" | "left" | "right" | "custom";
  productSource?: "popular" | "newest" | "manual";
  showName?: boolean;
  showSpec?: boolean;
  showPrice?: boolean;
  showFavorite?: boolean;
  showAddToCart?: boolean;
  showPrepTime?: boolean;
  showDifficulty?: boolean;
  useDesktopImage?: boolean;
  [key: string]: unknown;
};

export const DESKTOP_HOME_SECTION_DEFAULTS: Array<{
  section_key: string;
  title: string;
  sort_order: number;
  layout_type: string;
  columns: number;
  display_limit: number;
  settings_json: PageLayoutSettingsJson;
}> = [
  {
    section_key: "hero",
    title: "Hero Banner",
    sort_order: 1,
    layout_type: "full_width",
    columns: 1,
    display_limit: 5,
    settings_json: {
      title: "Hero Banner",
      showTitle: false,
      heroRatio: "5:2",
      heroMaxHeight: 600,
      focusPosition: "center",
      useDesktopImage: false,
    },
  },
  {
    section_key: "search",
    title: "搜尋",
    sort_order: 2,
    layout_type: "search",
    columns: 1,
    display_limit: 1,
    settings_json: { title: "搜尋", showTitle: false },
  },
  {
    section_key: "quick_services",
    title: "常用服務",
    sort_order: 3,
    layout_type: "icon_row",
    columns: 8,
    display_limit: 8,
    settings_json: { title: "常用服務", showTitle: true, gap: 24 },
  },
  {
    section_key: "latest_campaigns",
    title: "最新活動",
    sort_order: 4,
    layout_type: "grid",
    columns: 3,
    display_limit: 6,
    settings_json: {
      title: "最新活動",
      showTitle: true,
      showViewAll: true,
      viewAllUrl: "/articles?category=%E5%84%AA%E6%83%A0%E6%B4%BB%E5%8B%95",
      gap: 24,
    },
  },
  {
    section_key: "featured_recipes",
    title: "精選食譜",
    sort_order: 5,
    layout_type: "grid",
    columns: 4,
    display_limit: 8,
    settings_json: {
      title: "精選食譜",
      showTitle: true,
      showViewAll: true,
      viewAllUrl: "/recipes",
      imageRatio: "4:3",
      showPrepTime: true,
      showDifficulty: true,
      showFavorite: true,
      gap: 24,
    },
  },
  {
    section_key: "ingredient_shop",
    title: "一鍵買齊材料",
    sort_order: 6,
    layout_type: "grid",
    columns: 5,
    display_limit: 10,
    settings_json: {
      title: "一鍵買齊材料",
      showTitle: true,
      showViewAll: true,
      viewAllUrl: "/shop",
      cardStyle: "standard",
      showName: true,
      showSpec: true,
      showPrice: true,
      showFavorite: true,
      showAddToCart: true,
      gap: 20,
    },
  },
  {
    section_key: "popular_products",
    title: "熱門／新品",
    sort_order: 7,
    layout_type: "grid",
    columns: 5,
    display_limit: 10,
    settings_json: {
      title: "熱門商品",
      showTitle: true,
      showViewAll: true,
      viewAllUrl: "/shop/popular",
      productSource: "popular",
      cardStyle: "standard",
      showName: true,
      showSpec: true,
      showPrice: true,
      showFavorite: true,
      showAddToCart: true,
      gap: 20,
    },
  },
  {
    section_key: "shop_features",
    title: "商城特色",
    sort_order: 8,
    layout_type: "feature_row",
    columns: 4,
    display_limit: 4,
    settings_json: { title: "商城特色", showTitle: true },
  },
];
