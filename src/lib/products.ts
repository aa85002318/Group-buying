import type { Product } from "@/lib/types/database";

const CATEGORY_ALIASES: Record<string, string[]> = {
  食品: ["食品", "食品團購", "零食點心", "烘焙材料"],
  生鮮食材: ["生鮮食材", "生鮮蔬果", "生鮮"],
  冷凍食品: ["冷凍食品", "冷凍商品"],
  廚房用品: ["廚房用品", "烘焙材料"],
  居家清潔: ["居家清潔", "生活用品", "居家生活"],
  季節限定: ["季節限定", "保健食品", "保健品", "美妝保養", "寢具家居"],
};

export function matchesCategory(product: Product, category: string): boolean {
  if (product.category_id === category) return true;

  const catName = product.product_categories?.name;
  if (!catName) return false;
  if (catName === category) return true;

  const aliases = CATEGORY_ALIASES[category];
  if (aliases?.some((alias) => catName.includes(alias) || alias.includes(catName))) {
    return true;
  }

  return catName.includes(category) || category.includes(catName);
}

export function matchesSearch(product: Product, search: string): boolean {
  const keyword = search.trim().toLowerCase();
  if (!keyword) return true;

  const fields = [product.name, product.description, product.product_categories?.name].filter(
    Boolean
  ) as string[];

  return fields.some((field) => field.toLowerCase().includes(keyword));
}

export function matchesTag(product: Product, tag: string): boolean {
  if (tag === "限時優惠") {
    return product.original_price != null && product.original_price > product.price;
  }
  return false;
}

export function filterProducts(
  products: Product[],
  params: { search?: string | null; category?: string | null; tag?: string | null }
): Product[] {
  let result = [...products];

  if (params.category) {
    result = result.filter((product) => matchesCategory(product, params.category!));
  }

  if (params.search) {
    result = result.filter((product) => matchesSearch(product, params.search!));
  }

  if (params.tag) {
    result = result.filter((product) => matchesTag(product, params.tag!));
  }

  return result;
}

const RECOMMENDED_LIMIT = 4;

/** Pick up to `limit` related products: same category first, then others. */
export function pickRecommendedProducts(
  currentProductId: string,
  categoryId: string | null | undefined,
  products: Product[],
  limit = RECOMMENDED_LIMIT
): Product[] {
  const others = products.filter((p) => p.id !== currentProductId && p.is_active !== false);

  const sameCategory = categoryId
    ? others.filter((p) => p.category_id === categoryId)
    : [];

  const rest = others.filter((p) => !sameCategory.some((s) => s.id === p.id));

  return [...sameCategory, ...rest].slice(0, limit);
}
