import type { ProductCategory } from "@/types/product-category";

/**
 * Centralized category hrefs for home drawer.
 * Prefer existing /baking-materials/* and /group-buy routes used elsewhere in the app.
 * Edit links here only — do not scatter hrefs across UI components.
 */
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "baking-materials",
    name: "烘焙材料",
    slug: "baking-materials",
    href: "/baking-materials",
    icon: "Wheat",
    sortOrder: 10,
    enabled: true,
    children: [
      { id: "flour", name: "麵粉", slug: "flour", href: "/baking-materials/flour", sortOrder: 10, enabled: true },
      { id: "butter", name: "奶油", slug: "dairy", href: "/baking-materials/dairy", sortOrder: 20, enabled: true },
      { id: "cream", name: "鮮奶油", slug: "dairy-cream", href: "/baking-materials/dairy", sortOrder: 30, enabled: true },
      { id: "dairy", name: "乳製品", slug: "dairy-products", href: "/baking-materials/dairy", sortOrder: 40, enabled: true },
      { id: "sugar", name: "糖類", slug: "ingredients-sugar", href: "/baking-materials/ingredients", sortOrder: 50, enabled: true },
      { id: "eggs", name: "雞蛋與蛋製品", slug: "ingredients-egg", href: "/baking-materials/ingredients", sortOrder: 60, enabled: true },
      { id: "chocolate", name: "巧克力", slug: "chocolate", href: "/baking-materials/chocolate", sortOrder: 70, enabled: true },
      { id: "nuts", name: "堅果與果乾", slug: "ingredients-nuts", href: "/baking-materials/ingredients", sortOrder: 80, enabled: true },
      { id: "tools", name: "烘焙工具", slug: "tools", href: "/baking-materials/tools", sortOrder: 90, enabled: true },
      { id: "packaging", name: "包裝材料", slug: "packaging", href: "/baking-materials/packaging", sortOrder: 100, enabled: true },
    ],
  },
  {
    id: "group-buy",
    name: "團購",
    slug: "group-buy",
    href: "/group-buy",
    icon: "Gift",
    sortOrder: 20,
    enabled: true,
    children: [
      { id: "gb-living", name: "生活用品", slug: "living", href: "/group-buy", sortOrder: 10, enabled: true },
      { id: "gb-fresh", name: "生鮮食材", slug: "fresh", href: "/group-buy", sortOrder: 20, enabled: true },
      { id: "gb-frozen", name: "冷凍食品", slug: "frozen", href: "/group-buy?category=kitchen", sortOrder: 30, enabled: true },
      { id: "gb-snack", name: "零食點心", slug: "snack", href: "/group-buy?category=snack", sortOrder: 40, enabled: true },
      { id: "gb-drink", name: "飲品沖調", slug: "drink", href: "/group-buy", sortOrder: 50, enabled: true },
      { id: "gb-kitchen", name: "廚房用品", slug: "kitchen", href: "/group-buy?category=kitchen", sortOrder: 60, enabled: true },
      { id: "gb-season", name: "季節限定", slug: "seasonal", href: "/group-buy?category=seasonal", sortOrder: 70, enabled: true },
      { id: "gb-hot", name: "熱門團購", slug: "hot", href: "/group-buy", sortOrder: 80, enabled: true },
    ],
  },
  {
    id: "fresh-food",
    name: "食材生鮮",
    slug: "fresh-food",
    href: "/baking-materials/chilled-goods",
    sortOrder: 30,
    enabled: true,
    children: [
      { id: "chilled", name: "冷藏食品", slug: "chilled-goods", href: "/baking-materials/chilled-goods", sortOrder: 10, enabled: true },
      { id: "frozen-goods", name: "冷凍食品", slug: "frozen-goods", href: "/baking-materials/frozen-goods", sortOrder: 20, enabled: true },
    ],
  },
  {
    id: "drinks",
    name: "飲品沖調",
    slug: "drinks",
    href: "/baking-materials",
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "snacks",
    name: "零食點心",
    slug: "snacks",
    href: "/group-buy?category=snack",
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "cooking",
    name: "料理食材",
    slug: "cooking",
    href: "/baking-materials/ingredients",
    sortOrder: 60,
    enabled: true,
  },
  {
    id: "kitchenware",
    name: "餐廚用品",
    slug: "kitchenware",
    href: "/baking-materials/tools",
    sortOrder: 70,
    enabled: true,
  },
  {
    id: "packaging-root",
    name: "包裝材料",
    slug: "packaging-root",
    href: "/baking-materials/packaging",
    sortOrder: 80,
    enabled: true,
  },
  {
    id: "other",
    name: "其他商品",
    slug: "other",
    href: "/products",
    sortOrder: 90,
    enabled: true,
  },
];

export function getEnabledProductCategories(
  categories: ProductCategory[] = PRODUCT_CATEGORIES
): ProductCategory[] {
  return categories
    .filter((c) => c.enabled)
    .map((c) => ({
      ...c,
      children: c.children?.filter((child) => child.enabled).sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Flat list of categories + children for name-only search. */
export function flattenProductCategories(
  categories: ProductCategory[] = getEnabledProductCategories()
): ProductCategory[] {
  const out: ProductCategory[] = [];
  for (const cat of categories) {
    out.push(cat);
    if (cat.children?.length) out.push(...cat.children);
  }
  return out;
}
