import type { Product, ProductCategory } from "@/lib/types/database";

export type HomeProductSource = "automatic" | "manual" | "category";

export type HomeProductSortType = "hot" | "newest" | "sales" | "custom";

export type HomeProductBadgeType = "hot" | "recommend" | "limited" | "new" | "sold_out";

export type IngredientShopCategoryTab = {
  id: string;
  label: string;
  slug?: string | null;
  icon?: string | null;
  categoryId?: string | null;
};

export type HomeIngredientShopConfig = {
  enabled?: boolean;
  product_source?: HomeProductSource;
  category_ids?: string[];
  category_order?: string[];
  /** Fallback slugs when category_ids empty */
  category_slugs?: string[];
  category_labels?: Record<string, string>;
  manual_product_ids?: string[];
  product_limit?: number;
  sort_type?: HomeProductSortType;
  more_card_title?: string;
  more_card_subtitle?: string;
  more_card_link?: string;
};

export type HomeIngredientShopSectionData = {
  title: string;
  subtitle: string;
  viewAllUrl: string;
  config: HomeIngredientShopConfig;
  manualIds: string[];
  displayCount: number;
};

export type IngredientShopProduct = Product & {
  displayPrice: number;
  displayOriginalPrice: number | null;
  badge: HomeProductBadgeType | null;
};

export const DEFAULT_INGREDIENT_SHOP_CONFIG: HomeIngredientShopConfig = {
  enabled: true,
  product_source: "automatic",
  category_slugs: ["flour", "dairy", "sugar", "butter"],
  category_labels: {
    flour: "烘焙粉類",
    butter: "油脂類",
  },
  sort_type: "hot",
  product_limit: 12,
  more_card_title: "更多商品",
  more_card_subtitle: "查看更多烘焙材料",
  more_card_link: "/shop/categories",
};

export const DEFAULT_CATEGORY_TAB: IngredientShopCategoryTab = {
  id: "all",
  label: "全部商品",
  slug: null,
  icon: "🛒",
};

export type IngredientShopCategoriesResponse = {
  categories: ProductCategory[];
};
