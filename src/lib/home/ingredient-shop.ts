import { filterProductsByScope, getRecentProducts, pickHomeProducts } from "@/lib/home";
import type { HomepageBlock } from "@/lib/types/database";
import type { Product, ProductCategory } from "@/lib/types/database";
import { APP_ROUTES } from "@/lib/site-links";
import { resolveHomeBlock } from "@/lib/home/blocks";
import {
  DEFAULT_CATEGORY_TAB,
  DEFAULT_INGREDIENT_SHOP_CONFIG,
  type HomeIngredientShopConfig,
  type HomeIngredientShopSectionData,
  type HomeProductBadgeType,
  type HomeProductSortType,
  type IngredientShopCategoryTab,
  type IngredientShopProduct,
} from "@/types/home-product-section";

const SLUG_ICONS: Record<string, string> = {
  flour: "🌾",
  dairy: "🥛",
  sugar: "🍬",
  butter: "🧈",
  chocolate: "🍫",
};

export function parseIngredientShopConfig(
  raw: Record<string, unknown> | null | undefined
): HomeIngredientShopConfig {
  if (!raw) return { ...DEFAULT_INGREDIENT_SHOP_CONFIG };
  return {
    ...DEFAULT_INGREDIENT_SHOP_CONFIG,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_INGREDIENT_SHOP_CONFIG.enabled,
    product_source:
      raw.product_source === "manual" || raw.product_source === "category" || raw.product_source === "automatic"
        ? raw.product_source
        : DEFAULT_INGREDIENT_SHOP_CONFIG.product_source,
    category_ids: Array.isArray(raw.category_ids)
      ? raw.category_ids.map(String)
      : DEFAULT_INGREDIENT_SHOP_CONFIG.category_ids,
    category_order: Array.isArray(raw.category_order)
      ? raw.category_order.map(String)
      : DEFAULT_INGREDIENT_SHOP_CONFIG.category_order,
    category_slugs: Array.isArray(raw.category_slugs)
      ? raw.category_slugs.map(String)
      : DEFAULT_INGREDIENT_SHOP_CONFIG.category_slugs,
    category_labels:
      raw.category_labels && typeof raw.category_labels === "object"
        ? (raw.category_labels as Record<string, string>)
        : DEFAULT_INGREDIENT_SHOP_CONFIG.category_labels,
    manual_product_ids: Array.isArray(raw.manual_product_ids)
      ? raw.manual_product_ids.map(String)
      : undefined,
    product_limit:
      typeof raw.product_limit === "number"
        ? raw.product_limit
        : typeof raw.product_limit === "string"
          ? Number(raw.product_limit) || DEFAULT_INGREDIENT_SHOP_CONFIG.product_limit
          : DEFAULT_INGREDIENT_SHOP_CONFIG.product_limit,
    sort_type:
      raw.sort_type === "hot" ||
      raw.sort_type === "newest" ||
      raw.sort_type === "sales" ||
      raw.sort_type === "custom"
        ? raw.sort_type
        : DEFAULT_INGREDIENT_SHOP_CONFIG.sort_type,
    more_card_title:
      typeof raw.more_card_title === "string"
        ? raw.more_card_title
        : DEFAULT_INGREDIENT_SHOP_CONFIG.more_card_title,
    more_card_subtitle:
      typeof raw.more_card_subtitle === "string"
        ? raw.more_card_subtitle
        : DEFAULT_INGREDIENT_SHOP_CONFIG.more_card_subtitle,
    more_card_link:
      typeof raw.more_card_link === "string"
        ? raw.more_card_link
        : DEFAULT_INGREDIENT_SHOP_CONFIG.more_card_link,
  };
}

export function resolveIngredientShopSection(
  blocks: HomepageBlock[] | null | undefined
): HomeIngredientShopSectionData {
  const block = resolveHomeBlock(blocks, "ingredient_shop");
  const config = parseIngredientShopConfig(block.config);
  const subtitle =
    block.subtitle ||
    (typeof block.config?.subtitle === "string" ? block.config.subtitle : null) ||
    "完整食材一次購足，讓烘焙更輕鬆！";

  return {
    title: block.title || "一鍵買齊材料",
    subtitle,
    viewAllUrl: block.viewAllUrl || APP_ROUTES.bakingMaterials,
    config,
    manualIds:
      config.manual_product_ids?.length
        ? config.manual_product_ids
        : block.manualIds,
    displayCount: Math.max(1, block.displayCount || config.product_limit || 12),
  };
}

export function buildCategoryTabs(
  categories: ProductCategory[],
  config: HomeIngredientShopConfig
): IngredientShopCategoryTab[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const labels = config.category_labels ?? {};

  const orderedIds = config.category_order?.length
    ? config.category_order
    : config.category_ids?.length
      ? config.category_ids
      : null;

  if (orderedIds?.length) {
    const tabs = orderedIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((cat) => ({
        id: cat!.id,
        label: labels[cat!.slug] || cat!.name,
        slug: cat!.slug,
        icon: cat!.icon_emoji || SLUG_ICONS[cat!.slug] || "📦",
        categoryId: cat!.id,
      }));
    return [DEFAULT_CATEGORY_TAB, ...tabs];
  }

  const slugs = config.category_slugs ?? DEFAULT_INGREDIENT_SHOP_CONFIG.category_slugs ?? [];
  const tabs = slugs
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .map((cat) => ({
      id: cat!.id,
      label: labels[cat!.slug] || cat!.name,
      slug: cat!.slug,
      icon: cat!.icon_emoji || SLUG_ICONS[cat!.slug] || "📦",
      categoryId: cat!.id,
    }));

  return [DEFAULT_CATEGORY_TAB, ...tabs];
}

export function isProductSoldOut(product: Product): boolean {
  if (product.status === "sold_out") return true;
  return Number(product.stock) <= 0;
}

export function resolveProductBadge(product: Product): HomeProductBadgeType | null {
  if (isProductSoldOut(product)) return "sold_out";
  if (getRecentProducts([product], 14).length > 0) return "new";
  if (Number(product.sort_order ?? 0) <= 10 && Number(product.sort_order ?? 0) > 0) return "hot";
  return null;
}

export function toIngredientShopProduct(product: Product): IngredientShopProduct {
  const sale = product.sale_price != null ? Number(product.sale_price) : null;
  const price = Number(product.price);
  const original = product.original_price != null ? Number(product.original_price) : null;
  const displayPrice = sale != null && sale > 0 ? sale : price;
  const displayOriginalPrice =
    original != null && original > displayPrice
      ? original
      : sale != null && price > sale
        ? price
        : null;

  return {
    ...product,
    displayPrice,
    displayOriginalPrice,
    badge: resolveProductBadge(product),
  };
}

function sortProducts(products: Product[], sortType: HomeProductSortType): Product[] {
  const list = [...products];
  switch (sortType) {
    case "newest":
      return list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    case "sales":
      return list.sort(
        (a, b) => Number(b.sort_order ?? 0) - Number(a.sort_order ?? 0)
      );
    case "custom":
      return list.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
    case "hot":
    default:
      return list.sort((a, b) => {
        const aHot = resolveProductBadge(a) === "hot" ? 1 : 0;
        const bHot = resolveProductBadge(b) === "hot" ? 1 : 0;
        if (bHot !== aHot) return bHot - aHot;
        return String(b.updated_at).localeCompare(String(a.updated_at));
      });
  }
}

export function pickIngredientShopProducts(options: {
  products: Product[];
  config: HomeIngredientShopConfig;
  manualIds: string[];
  categoryId?: string | null;
  limit: number;
}): IngredientShopProduct[] {
  const { products, config, manualIds, categoryId, limit } = options;
  const baking = filterProductsByScope(products, "baking").filter(
    (p) => p.is_active !== false && p.status !== "inactive" && p.status !== "draft"
  );

  let pool = baking;
  if (categoryId && categoryId !== "all") {
    pool = pool.filter((p) => p.category_id === categoryId);
  }

  const source = config.product_source ?? "automatic";
  let picked: Product[] = [];

  if (source === "manual") {
    picked = pickHomeProducts({
      products: pool,
      manualIds,
      mode: "manual",
      limit,
    });
  } else if (source === "category" && categoryId && categoryId !== "all") {
    picked = sortProducts(pool, config.sort_type ?? "hot").slice(0, limit);
  } else {
    const mode = manualIds.length > 0 ? "mixed" : "auto";
    picked = pickHomeProducts({
      products: pool,
      manualIds,
      autoList: sortProducts(pool, config.sort_type ?? "hot"),
      mode,
      limit,
    });
  }

  return picked.map(toIngredientShopProduct);
}
