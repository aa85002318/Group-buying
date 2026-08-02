/** Shop hub Version C — AI 靈感探索（recipe-backed） */

export type InspirationRecipeDifficulty = 1 | 2 | 3 | 4 | 5;

export type InspirationRecipe = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string;
  description?: string;
  rating?: number;
  rating_count?: number;
  duration_minutes?: number;
  difficulty?: InspirationRecipeDifficulty;
  category?: string;
  category_slug?: string;
  is_featured_inspiration?: boolean;
  inspiration_sort_order?: number;
  ingredient_product_ids?: string[];
  inspiration_use_ip_image?: boolean;
  favorite_count?: number;
  href: string;
};

export type InspirationCategoryItem = {
  id: string;
  label: string;
  slug: string;
  icon: string;
};

export const INSPIRATION_IP_IMAGE = "/branding/chimeidiy-ip-angel.png";

export const INSPIRATION_WALL_CATEGORIES: InspirationCategoryItem[] = [
  { id: "hot", label: "熱門推薦", slug: "hot", icon: "🔥" },
  { id: "cake", label: "蛋糕", slug: "cake", icon: "🍰" },
  { id: "cookie", label: "餅乾", slug: "cookie", icon: "🍪" },
  { id: "bread", label: "麵包", slug: "bread", icon: "🍞" },
  { id: "dessert", label: "甜點", slug: "dessert", icon: "🍮" },
  { id: "all", label: "全部", slug: "all", icon: "✨" },
];

const FALLBACK_COVERS = [
  "/images/home/group-buy-banner/slide-kitchen.png",
  "/images/home/latest-campaigns/01-free-shipping.jpg",
  "/images/shop/hero-mobile.jpg",
  "/images/home/group-buy-banner/ip-angel.svg",
];

/** Demo recipes when CMS has no wall content yet */
export const DEMO_INSPIRATION_RECIPES: InspirationRecipe[] = [
  {
    id: "demo-insp-1",
    slug: "strawberry-cream-cake",
    title: "草莓鮮奶油蛋糕",
    cover_image_url: FALLBACK_COVERS[0],
    description: "酸甜草莓搭配滑順鮮奶油，幸福滿分的經典蛋糕。",
    rating: 4.9,
    rating_count: 2450,
    duration_minutes: 30,
    difficulty: 2,
    category: "蛋糕",
    category_slug: "cake",
    is_featured_inspiration: true,
    inspiration_sort_order: 0,
    inspiration_use_ip_image: true,
    favorite_count: 1280,
    href: "/recipes/strawberry-cream-cake",
  },
  {
    id: "demo-insp-2",
    slug: "soft-milk-toast",
    title: "超柔軟生吐司",
    cover_image_url: FALLBACK_COVERS[1],
    description: "綿密濕潤、冷了也好吃的生吐司。",
    rating: 4.8,
    rating_count: 1820,
    duration_minutes: 210,
    difficulty: 3,
    category: "麵包",
    category_slug: "bread",
    inspiration_sort_order: 10,
    favorite_count: 960,
    href: "/recipes/soft-milk-toast",
  },
  {
    id: "demo-insp-3",
    slug: "classic-choc-chip-cookies",
    title: "經典巧克力餅乾",
    cover_image_url: FALLBACK_COVERS[2],
    description: "外脆內軟，耐烤巧克力豆的人氣款。",
    rating: 4.7,
    rating_count: 1320,
    duration_minutes: 45,
    difficulty: 1,
    category: "餅乾",
    category_slug: "cookie",
    inspiration_sort_order: 20,
    favorite_count: 840,
    href: "/recipes/classic-choc-chip-cookies",
  },
  {
    id: "demo-insp-4",
    slug: "lemon-tart",
    title: "法式檸檬塔",
    cover_image_url: FALLBACK_COVERS[0],
    description: "酸香檸檬餡搭配酥脆塔皮。",
    rating: 4.6,
    rating_count: 780,
    duration_minutes: 90,
    difficulty: 3,
    category: "甜點",
    category_slug: "dessert",
    inspiration_sort_order: 30,
    favorite_count: 520,
    href: "/recipes/lemon-tart",
  },
  {
    id: "demo-insp-5",
    slug: "matcha-roll-cake",
    title: "抹茶生乳捲",
    cover_image_url: FALLBACK_COVERS[1],
    description: "清香抹茶蛋糕體與生乳餡的絕配。",
    rating: 4.8,
    rating_count: 990,
    duration_minutes: 75,
    difficulty: 3,
    category: "蛋糕",
    category_slug: "cake",
    inspiration_sort_order: 40,
    favorite_count: 710,
    href: "/recipes/matcha-roll-cake",
  },
  {
    id: "demo-insp-6",
    slug: "butter-cookies",
    title: "奶油餅乾（新手友善）",
    cover_image_url: FALLBACK_COVERS[2],
    description: "入口即化的經典奶油餅乾。",
    rating: 4.5,
    rating_count: 640,
    duration_minutes: 45,
    difficulty: 1,
    category: "餅乾",
    category_slug: "cookie",
    inspiration_sort_order: 50,
    favorite_count: 430,
    href: "/recipes/butter-cookies",
  },
];

export function difficultyFromLegacy(
  value: string | null | undefined
): InspirationRecipeDifficulty {
  if (value === "hard") return 4;
  if (value === "medium") return 3;
  return 2;
}

export function clampDifficulty(
  value: unknown
): InspirationRecipeDifficulty | undefined {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.round(n);
  if (i < 1 || i > 5) return undefined;
  return i as InspirationRecipeDifficulty;
}

export function mapRecipeRowToInspiration(
  row: Record<string, unknown>,
  favoriteCount = 0
): InspirationRecipe {
  const slug = String(row.slug ?? "").trim() || String(row.id ?? "");
  const categoryRel = row.recipe_categories as
    | { name?: string; slug?: string }
    | null
    | undefined;
  const duration =
    row.duration_minutes != null
      ? Number(row.duration_minutes)
      : row.total_time != null
        ? Number(row.total_time)
        : (Number(row.prep_time ?? 0) || 0) + (Number(row.cook_time ?? 0) || 0);

  const star =
    clampDifficulty(row.inspiration_difficulty) ??
    difficultyFromLegacy(
      typeof row.difficulty === "string" ? row.difficulty : undefined
    );

  const productIds = Array.isArray(row.ingredient_product_ids)
    ? (row.ingredient_product_ids as unknown[])
        .map((id) => String(id ?? "").trim())
        .filter(Boolean)
    : [];

  const cover =
    String(row.cover_image ?? row.cover_image_url ?? "").trim() ||
    FALLBACK_COVERS[0];

  const inspCat = String(row.inspiration_category ?? "").trim();
  const catSlug = inspCat || String(categoryRel?.slug ?? "").trim() || undefined;

  return {
    id: String(row.id ?? slug),
    slug,
    title: String(row.title ?? "未命名食譜").trim() || "未命名食譜",
    cover_image_url: cover,
    description: row.summary ? String(row.summary) : undefined,
    rating: favoriteCount > 0 ? Math.min(5, 4.2 + Math.min(favoriteCount, 400) / 500) : 4.8,
    rating_count: favoriteCount > 0 ? favoriteCount * 3 : undefined,
    duration_minutes: duration > 0 ? duration : undefined,
    difficulty: star,
    category: categoryRel?.name ? String(categoryRel.name) : inspCat || undefined,
    category_slug: catSlug,
    is_featured_inspiration: row.is_featured_inspiration === true,
    inspiration_sort_order: Number(row.inspiration_sort_order ?? 0) || 0,
    ingredient_product_ids: productIds,
    inspiration_use_ip_image: row.inspiration_use_ip_image !== false,
    favorite_count: favoriteCount,
    href: `/recipes/${slug}`,
  };
}

export function filterInspirationByCategory(
  recipes: InspirationRecipe[],
  categorySlug: string | null | undefined
): InspirationRecipe[] {
  const slug = (categorySlug || "hot").trim().toLowerCase();
  if (!slug || slug === "all") return recipes;
  if (slug === "hot") {
    return [...recipes].sort(
      (a, b) =>
        (b.favorite_count ?? b.rating_count ?? 0) -
        (a.favorite_count ?? a.rating_count ?? 0)
    );
  }
  if (slug === "dessert") {
    return recipes.filter((r) => {
      const s = (r.category_slug || "").toLowerCase();
      const n = (r.category || "").toLowerCase();
      return (
        s === "dessert" ||
        s === "tart" ||
        s === "sweet" ||
        n.includes("甜") ||
        n.includes("塔")
      );
    });
  }
  return recipes.filter(
    (r) => (r.category_slug || "").toLowerCase() === slug
  );
}

export function pickFeaturedInspiration(
  recipes: InspirationRecipe[]
): InspirationRecipe | null {
  const featured = recipes
    .filter((r) => r.is_featured_inspiration)
    .sort(
      (a, b) => (a.inspiration_sort_order ?? 0) - (b.inspiration_sort_order ?? 0)
    );
  if (featured[0]) return featured[0];
  if (recipes[0]) return recipes[0];
  return null;
}

export function difficultyStars(value?: InspirationRecipeDifficulty | number) {
  const n = Math.max(1, Math.min(5, Number(value ?? 2)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}
