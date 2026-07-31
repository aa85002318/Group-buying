import { SHOP_CATEGORIES, shopCategoryHref } from "@/lib/shop/paths";

/** Shop home circular category menu item. */
export type ShopCategoryItem = {
  id: string;
  name: string;
  href: string;
  bgColor: string;
  /** Illustration path (transparent PNG). Omit when using grid icon. */
  image?: string;
  /** Lucide key — only "grid" for 全部分類 */
  icon?: "grid";
};

/**
 * Default 8 product categories + frontend-appended「全部分類」.
 * Hrefs use /shop/category/* under the mall storefront.
 */
export const DEFAULT_SHOP_CATEGORIES: ShopCategoryItem[] = [
  {
    id: "flour",
    name: "麵粉",
    image: "/images/shop/categories/flour.png",
    href: shopCategoryHref("flour"),
    bgColor: "#FFF5D9",
  },
  {
    id: "butter",
    name: "奶油",
    image: "/images/shop/categories/butter.png",
    href: shopCategoryHref("dairy"),
    bgColor: "#FFF5D9",
  },
  {
    id: "chocolate",
    name: "巧克力",
    image: "/images/shop/categories/chocolate.png",
    href: shopCategoryHref("chocolate"),
    bgColor: "#FFE8E8",
  },
  {
    id: "packaging",
    name: "包裝材料",
    image: "/images/shop/categories/packaging.png",
    href: shopCategoryHref("packaging"),
    bgColor: "#FFF0E2",
  },
  {
    id: "baking-mold",
    name: "烘焙模具",
    image: "/images/shop/categories/baking-mold.png",
    href: shopCategoryHref("tools"),
    bgColor: "#EAF4DA",
  },
  {
    id: "baking-tools",
    name: "烘焙工具",
    image: "/images/shop/categories/baking-tools.png",
    href: shopCategoryHref("tools"),
    bgColor: "#EEE9FF",
  },
  {
    id: "frozen",
    name: "冷凍冷藏",
    image: "/images/shop/categories/frozen.png",
    href: shopCategoryHref("frozen-goods"),
    bgColor: "#DFF3FF",
  },
  {
    id: "food",
    name: "食品食材",
    image: "/images/shop/categories/food.png",
    href: shopCategoryHref("ingredients"),
    bgColor: "#FFE5E5",
  },
];

export const SHOP_ALL_CATEGORIES_ITEM: ShopCategoryItem = {
  id: "all",
  name: "全部分類",
  icon: "grid",
  href: SHOP_CATEGORIES,
  bgColor: "#F1F2F7",
};

/** Max product categories before appending「全部分類」. */
export const SHOP_HOME_CATEGORY_LIMIT = 8;

export function buildShopHomeCategories(
  items: ShopCategoryItem[] = DEFAULT_SHOP_CATEGORIES
): ShopCategoryItem[] {
  const visible = items
    .filter((c) => c.id !== "all" && c.icon !== "grid")
    .slice(0, SHOP_HOME_CATEGORY_LIMIT);
  return [...visible, SHOP_ALL_CATEGORIES_ITEM];
}
