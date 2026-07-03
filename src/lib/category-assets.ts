/** 商品分類圖示（public/categories） */
export const CATEGORY_IMAGE_PATHS = {
  food: "/categories/food.png",
  fresh: "/categories/fresh.png",
  frozen: "/categories/frozen.png",
  kitchen: "/categories/kitchen.png",
  cleaning: "/categories/cleaning.png",
  seasonal: "/categories/seasonal.png",
} as const;

export const CATEGORY_IMAGE_DEFAULTS: Array<{
  slug: keyof typeof CATEGORY_IMAGE_PATHS;
  name: string;
  sort_order: number;
}> = [
  { slug: "food", name: "食品", sort_order: 1 },
  { slug: "fresh", name: "生鮮食材", sort_order: 2 },
  { slug: "frozen", name: "冷凍食品", sort_order: 3 },
  { slug: "kitchen", name: "廚房用品", sort_order: 4 },
  { slug: "cleaning", name: "居家清潔", sort_order: 5 },
  { slug: "seasonal", name: "季節限定", sort_order: 6 },
];
