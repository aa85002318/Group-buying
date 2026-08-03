/** Shop home — 烘焙靈感牆 */

export type InspirationCategory =
  | "all"
  | "community"
  | "recipe"
  | "teacher"
  | "tip"
  | "knowledge";

export type InspirationCardType =
  | "community"
  | "recipe"
  | "teacher"
  | "tip"
  | "knowledge";

export type InspirationAspect = "1/1" | "4/5" | "3/4";

export type ShopInspirationPost = {
  id: string;
  category: Exclude<InspirationCategory, "all">;
  card_type: InspirationCardType;
  title: string;
  image_url: string;
  aspect: InspirationAspect;
  author_name: string;
  author_avatar: string | null;
  time_label: string | null;
  likes: number;
  comments: number;
  materials: string[];
  rating: number;
  difficulty: string | null;
  cook_time: string | null;
  tip_body: string | null;
  product_name: string | null;
  product_href: string | null;
  href: string;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
};

export const INSPIRATION_TAGS: { id: InspirationCategory; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "community", label: "大家作品" },
  { id: "recipe", label: "食譜靈感" },
  { id: "teacher", label: "老師作品" },
  { id: "tip", label: "烘焙心得" },
  { id: "knowledge", label: "烘焙知識" },
];

export const INSPIRATION_THEME_LABEL: Record<
  Exclude<InspirationCategory, "all">,
  string
> = {
  community: "大家作品",
  recipe: "食譜靈感",
  teacher: "老師作品",
  tip: "烘焙心得",
  knowledge: "烘焙知識",
};

export const INSPIRATION_THEME_CLASS: Record<
  Exclude<InspirationCategory, "all">,
  string
> = {
  community: "bg-[#153E73] text-white",
  recipe: "bg-[#F5A623] text-white",
  teacher: "bg-[#7C5CFF] text-white",
  tip: "bg-[#F16458] text-white",
  knowledge: "bg-[#2F9E7B] text-white",
};

const CATEGORY_IDS = new Set<string>([
  "community",
  "recipe",
  "teacher",
  "tip",
  "knowledge",
]);

function normalizeCategory(
  value: string
): Exclude<InspirationCategory, "all"> {
  return CATEGORY_IDS.has(value)
    ? (value as Exclude<InspirationCategory, "all">)
    : "community";
}

const IMG = {
  cake: "/images/home/latest-campaigns/02-group-buy.jpg",
  bread: "/images/home/group-buy-banner/slide-snack.png",
  dessert: "/images/home/group-buy-banner/slide-dessert.png",
  kitchen: "/images/home/group-buy-banner/slide-kitchen.png",
  season: "/images/home/group-buy-banner/slide-season.png",
  live: "/images/home/latest-campaigns/03-live.jpg",
  ship: "/images/home/latest-campaigns/01-free-shipping.jpg",
  spring: "/images/shop/promo/spring-5x2.jpg",
} as const;

/** Demo posts — visible without CMS seed. */
export const DEFAULT_INSPIRATION_POSTS: ShopInspirationPost[] = [
  {
    id: "insp-1",
    category: "community",
    card_type: "community",
    title: "草莓鮮奶油蛋糕",
    image_url: IMG.dessert,
    aspect: "4/5",
    author_name: "小麥烘焙日記",
    author_avatar: null,
    time_label: "2小時前",
    likes: 128,
    comments: 16,
    materials: ["低筋麵粉", "鮮奶油"],
    rating: 5,
    difficulty: null,
    cook_time: null,
    tip_body: null,
    product_name: null,
    product_href: null,
    href: "/recipes",
    is_featured: true,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "insp-2",
    category: "recipe",
    card_type: "recipe",
    title: "超柔軟生吐司",
    image_url: IMG.bread,
    aspect: "1/1",
    author_name: "麵包控",
    author_avatar: null,
    time_label: null,
    likes: 86,
    comments: 9,
    materials: ["高筋麵粉", "奶油"],
    rating: 5,
    difficulty: "中等",
    cook_time: "約 3.5 小時",
    tip_body: null,
    product_name: null,
    product_href: null,
    href: "/recipes",
    is_featured: true,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "insp-3",
    category: "teacher",
    card_type: "teacher",
    title: "香草藍莓奶霜蛋糕捲",
    image_url: IMG.cake,
    aspect: "3/4",
    author_name: "珊珊老師",
    author_avatar: null,
    time_label: null,
    likes: 210,
    comments: 24,
    materials: ["鮮奶油"],
    rating: 5,
    difficulty: null,
    cook_time: null,
    tip_body: null,
    product_name: null,
    product_href: null,
    href: "/recipes",
    is_featured: true,
    sort_order: 3,
    is_active: true,
  },
  {
    id: "insp-4",
    category: "community",
    card_type: "community",
    title: "經典巧克力餅乾",
    image_url: IMG.season,
    aspect: "1/1",
    author_name: "甜點控小鹿",
    author_avatar: null,
    time_label: "昨天",
    likes: 96,
    comments: 11,
    materials: ["耐烤巧克力豆"],
    rating: 4,
    difficulty: null,
    cook_time: null,
    tip_body: null,
    product_name: null,
    product_href: null,
    href: "/recipes",
    is_featured: false,
    sort_order: 4,
    is_active: true,
  },
  {
    id: "insp-5",
    category: "tip",
    card_type: "tip",
    title: "第一次做餅乾成功！",
    image_url: IMG.kitchen,
    aspect: "3/4",
    author_name: "烘焙小白",
    author_avatar: null,
    time_label: "3天前",
    likes: 64,
    comments: 8,
    materials: ["法國發酵奶油"],
    rating: 5,
    difficulty: null,
    cook_time: null,
    tip_body: "溫度控好、冷藏夠久，餅乾邊緣酥脆中間軟！推薦這款奶油。",
    product_name: "法國發酵奶油",
    product_href: "/shop",
    href: "/articles",
    is_featured: false,
    sort_order: 5,
    is_active: true,
  },
  {
    id: "insp-6",
    category: "teacher",
    card_type: "teacher",
    title: "脆皮泡芙",
    image_url: IMG.live,
    aspect: "4/5",
    author_name: "米蘭老師",
    author_avatar: null,
    time_label: null,
    likes: 178,
    comments: 19,
    materials: ["泡芙預拌粉"],
    rating: 5,
    difficulty: null,
    cook_time: null,
    tip_body: null,
    product_name: null,
    product_href: null,
    href: "/recipes",
    is_featured: true,
    sort_order: 6,
    is_active: true,
  },
  {
    id: "insp-7",
    category: "recipe",
    card_type: "recipe",
    title: "香酥可頌蛋塔",
    image_url: IMG.spring,
    aspect: "1/1",
    author_name: "CHIMEIDIY",
    author_avatar: null,
    time_label: null,
    likes: 142,
    comments: 14,
    materials: ["冷凍可頌"],
    rating: 4,
    difficulty: "簡單",
    cook_time: "約 45 分鐘",
    tip_body: null,
    product_name: null,
    product_href: null,
    href: "/recipes",
    is_featured: false,
    sort_order: 7,
    is_active: true,
  },
  {
    id: "insp-8",
    category: "community",
    card_type: "community",
    title: "伯爵司康",
    image_url: IMG.ship,
    aspect: "4/5",
    author_name: "Baking Life",
    author_avatar: null,
    time_label: "5小時前",
    likes: 73,
    comments: 7,
    materials: ["伯爵茶粉"],
    rating: 5,
    difficulty: null,
    cook_time: null,
    tip_body: null,
    product_name: null,
    product_href: null,
    href: "/recipes",
    is_featured: false,
    sort_order: 8,
    is_active: true,
  },
  {
    id: "insp-9",
    category: "knowledge",
    card_type: "knowledge",
    title: "低筋／中筋／高筋怎麼選？",
    image_url: IMG.kitchen,
    aspect: "1/1",
    author_name: "CHIMEIDIY",
    author_avatar: null,
    time_label: null,
    likes: 112,
    comments: 12,
    materials: ["高筋麵粉", "低筋麵粉"],
    rating: 5,
    difficulty: null,
    cook_time: "閱讀 3 分鐘",
    tip_body: "筋性決定成品結構：吐司選高筋、蛋糕選低筋，搞懂就不易失敗。",
    product_name: null,
    product_href: null,
    href: "/articles",
    is_featured: true,
    sort_order: 9,
    is_active: true,
  },
];

export function mapInspirationRow(row: Record<string, unknown>): ShopInspirationPost {
  const category = normalizeCategory(String(row.category ?? "community"));
  const cardType = normalizeCategory(
    String(row.card_type ?? row.category ?? "community")
  ) as InspirationCardType;
  const aspectRaw = String(row.aspect ?? "4/5");
  const aspect = (["1/1", "4/5", "3/4"].includes(aspectRaw) ? aspectRaw : "4/5") as InspirationAspect;
  const materials = Array.isArray(row.materials)
    ? row.materials.map(String)
    : typeof row.materials === "string"
      ? row.materials.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    id: String(row.id),
    category,
    card_type: cardType,
    title: String(row.title ?? ""),
    image_url: String(row.image_url ?? IMG.dessert),
    aspect,
    author_name: String(row.author_name ?? "CHIMEIDIY"),
    author_avatar: row.author_avatar ? String(row.author_avatar) : null,
    time_label: row.time_label ? String(row.time_label) : null,
    likes: Number(row.likes ?? 0) || 0,
    comments: Number(row.comments ?? 0) || 0,
    materials,
    rating: Math.min(5, Math.max(0, Number(row.rating ?? 5) || 5)),
    difficulty: row.difficulty ? String(row.difficulty) : null,
    cook_time: row.cook_time ? String(row.cook_time) : null,
    tip_body: row.tip_body ? String(row.tip_body) : null,
    product_name: row.product_name ? String(row.product_name) : null,
    product_href: row.product_href ? String(row.product_href) : null,
    href: String(row.href ?? "/recipes"),
    is_featured: row.is_featured !== false && row.is_featured !== 0,
    sort_order: Number(row.sort_order ?? 100) || 100,
    is_active: row.is_active !== false && row.is_active !== 0,
  };
}

export function aspectToRowSpan(aspect: InspirationAspect, cardType: InspirationCardType): number {
  /* Compact hub footprint — ~30% shorter than full masonry spans */
  const base = aspect === "1/1" ? 20 : aspect === "4/5" ? 24 : 26;
  if (cardType === "tip" || cardType === "knowledge") return base - 1;
  if (cardType === "teacher") return base + 1;
  if (cardType === "recipe") return base;
  return base + 2;
}
