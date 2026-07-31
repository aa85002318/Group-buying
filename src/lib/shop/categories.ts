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
 * Hrefs use existing /baking-materials/* routes (no duplicate /shop/category tree).
 */
export const DEFAULT_SHOP_CATEGORIES: ShopCategoryItem[] = [
  {
    id: "flour",
    name: "麵粉",
    image: "/images/shop/categories/flour.png",
    href: "/baking-materials/flour",
    bgColor: "#FFF5D9",
  },
  {
    id: "butter",
    name: "奶油",
    image: "/images/shop/categories/butter.png",
    href: "/baking-materials/dairy",
    bgColor: "#FFF5D9",
  },
  {
    id: "chocolate",
    name: "巧克力",
    image: "/images/shop/categories/chocolate.png",
    href: "/baking-materials/chocolate",
    bgColor: "#FFE8E8",
  },
  {
    id: "packaging",
    name: "包裝材料",
    image: "/images/shop/categories/packaging.png",
    href: "/baking-materials/packaging",
    bgColor: "#FFF0E2",
  },
  {
    id: "baking-mold",
    name: "烘焙模具",
    image: "/images/shop/categories/baking-mold.png",
    href: "/baking-materials/tools",
    bgColor: "#EAF4DA",
  },
  {
    id: "baking-tools",
    name: "烘焙工具",
    image: "/images/shop/categories/baking-tools.png",
    href: "/baking-materials/tools",
    bgColor: "#EEE9FF",
  },
  {
    id: "frozen",
    name: "冷凍冷藏",
    image: "/images/shop/categories/frozen.png",
    href: "/baking-materials/frozen-goods",
    bgColor: "#DFF3FF",
  },
  {
    id: "food",
    name: "食品食材",
    image: "/images/shop/categories/food.png",
    href: "/baking-materials/ingredients",
    bgColor: "#FFE5E5",
  },
];

export const SHOP_ALL_CATEGORIES_ITEM: ShopCategoryItem = {
  id: "all",
  name: "全部分類",
  icon: "grid",
  href: "/baking-materials",
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
