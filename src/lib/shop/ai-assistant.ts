/** Shop home — AI 烘焙助手 */

export type ShopAiChip = {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
  sort_order: number;
  is_active: boolean;
};

export type ShopAiRecipeCard = {
  id: string;
  title: string;
  image_url: string;
  rating: number;
  cook_time: string;
  href: string;
};

export type ShopAiMaterialThumb = {
  id: string;
  name: string;
  image_url: string;
  href: string;
};

export type ShopAiRecommendBundle = {
  queryKey: string;
  recipes: ShopAiRecipeCard[];
  materials: ShopAiMaterialThumb[];
  tools: string[];
  cartProductIds: string[];
};

export const DEFAULT_AI_CHIPS: ShopAiChip[] = [
  { id: "chip-1", label: "想做生吐司", emoji: "🥖", prompt: "想做生吐司", sort_order: 1, is_active: true },
  { id: "chip-2", label: "乳酪蛋糕", emoji: "🍰", prompt: "乳酪蛋糕", sort_order: 2, is_active: true },
  { id: "chip-3", label: "簡單餅乾", emoji: "🍪", prompt: "簡單餅乾", sort_order: 3, is_active: true },
  { id: "chip-4", label: "馬芬蛋糕", emoji: "🧁", prompt: "馬芬", sort_order: 4, is_active: true },
  { id: "chip-5", label: "可頌", emoji: "🥐", prompt: "可頌", sort_order: 5, is_active: true },
  { id: "chip-6", label: "佛卡夏", emoji: "🍞", prompt: "佛卡夏", sort_order: 6, is_active: true },
];

const RECIPE_IMG = {
  a: "/images/home/group-buy-banner/slide-snack.png",
  b: "/images/home/group-buy-banner/slide-dessert.png",
  c: "/images/home/group-buy-banner/slide-kitchen.png",
  d: "/images/shop/promo/spring-5x2.jpg",
  e: "/images/home/latest-campaigns/02-group-buy.jpg",
} as const;

const CAT = {
  flour: "/images/shop/categories/flour.png",
  butter: "/images/shop/categories/butter.png",
  chocolate: "/images/shop/categories/chocolate.png",
  food: "/images/shop/categories/food.png",
  mold: "/images/shop/categories/baking-mold.png",
  tools: "/images/shop/categories/baking-tools.png",
} as const;

/** Demo recommend map — key matched loosely against chip / query. */
export const DEFAULT_AI_RECOMMEND: ShopAiRecommendBundle[] = [
  {
    queryKey: "生吐司",
    recipes: [
      {
        id: "rec-toast-1",
        title: "北海道生吐司",
        image_url: RECIPE_IMG.a,
        rating: 5,
        cook_time: "約 4 小時",
        href: "/recipes",
      },
      {
        id: "rec-toast-2",
        title: "湯種生吐司",
        image_url: RECIPE_IMG.c,
        rating: 5,
        cook_time: "約 3.5 小時",
        href: "/recipes",
      },
      {
        id: "rec-toast-3",
        title: "蜂蜜牛奶吐司",
        image_url: RECIPE_IMG.d,
        rating: 4,
        cook_time: "約 3 小時",
        href: "/recipes",
      },
    ],
    materials: [
      { id: "m1", name: "高筋麵粉", image_url: CAT.flour, href: "/shop/categories" },
      { id: "m2", name: "鮮奶油", image_url: CAT.food, href: "/shop/categories" },
      { id: "m3", name: "無鹽奶油", image_url: CAT.butter, href: "/shop/categories" },
      { id: "m4", name: "蜂蜜", image_url: CAT.food, href: "/shop/categories" },
      { id: "m5", name: "牛奶", image_url: CAT.food, href: "/shop/categories" },
      { id: "m6", name: "即溶酵母", image_url: CAT.flour, href: "/shop/categories" },
    ],
    tools: ["吐司模", "刮板", "電子秤", "發酵箱"],
    cartProductIds: [],
  },
  {
    queryKey: "乳酪蛋糕",
    recipes: [
      {
        id: "rec-cheese-1",
        title: "經典重乳酪蛋糕",
        image_url: RECIPE_IMG.b,
        rating: 5,
        cook_time: "約 2 小時",
        href: "/recipes",
      },
      {
        id: "rec-cheese-2",
        title: "輕乳酪蛋糕",
        image_url: RECIPE_IMG.e,
        rating: 4,
        cook_time: "約 90 分鐘",
        href: "/recipes",
      },
      {
        id: "rec-cheese-3",
        title: "巴斯克乳酪蛋糕",
        image_url: RECIPE_IMG.d,
        rating: 5,
        cook_time: "約 80 分鐘",
        href: "/recipes",
      },
    ],
    materials: [
      { id: "c1", name: "奶油乳酪", image_url: CAT.food, href: "/shop/categories" },
      { id: "c2", name: "低筋麵粉", image_url: CAT.flour, href: "/shop/categories" },
      { id: "c3", name: "雞蛋", image_url: CAT.food, href: "/shop/categories" },
      { id: "c4", name: "鮮奶油", image_url: CAT.butter, href: "/shop/categories" },
    ],
    tools: ["圓模", "刮刀", "電子秤", "烤盤"],
    cartProductIds: [],
  },
];

export function resolveAiRecommend(query: string): ShopAiRecommendBundle {
  const q = query.trim();
  const hit =
    DEFAULT_AI_RECOMMEND.find((b) => q.includes(b.queryKey)) ||
    DEFAULT_AI_RECOMMEND.find((b) => b.queryKey.includes(q)) ||
    DEFAULT_AI_RECOMMEND[0];
  return hit;
}

export function mapAiChipRow(row: Record<string, unknown>): ShopAiChip {
  return {
    id: String(row.id),
    label: String(row.label ?? ""),
    emoji: String(row.emoji ?? "✨"),
    prompt: String(row.prompt ?? row.label ?? ""),
    sort_order: Number(row.sort_order ?? 100) || 100,
    is_active: row.is_active !== false && row.is_active !== 0,
  };
}
