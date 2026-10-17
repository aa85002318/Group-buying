/**
 * 首頁「商品展示區域」(custom_products) 的設定。
 *
 * 全部存在 homepage_blocks.config，不新增資料表；分類用既有的
 * product_categories.id，商品歸屬沿用既有的 product_category_links（M2M）
 * 以及 products.category_id / primary_category_id。
 */

/**
 * 只要有這些欄位就能挑：網站版首頁用的是自己的精簡型別，
 * 後台用的是資料庫完整型別，共用同一套邏輯。
 */
export type PickableProduct = {
  id: string;
  name?: string | null;
  price?: number | null;
  sale_price?: number | null;
  website_price?: number | null;
  created_at?: string | null;
  category_id?: string | null;
  primary_category_id?: string | null;
  category_ids?: string[] | null;
  is_hot?: boolean | null;
  is_popular?: boolean | null;
};

export type ProductBlockSource =
  | "all" // 全部商品
  | "category" // 指定商品分類
  | "manual" // 手動指定商品
  | "newest" // 最新上架
  | "popular"; // 熱門商品（依 is_popular / is_hot 旗標）

export type ProductBlockSort = "newest" | "price_asc" | "price_desc" | "manual";

export type ProductBlockSettings = {
  source: ProductBlockSource;
  /** source === "category" 時使用；空陣列 = 還沒選 */
  categoryIds: string[];
  /** 選了父分類時，是否一併包含子分類的商品 */
  includeChildCategories: boolean;
  sort: ProductBlockSort;
  limit: number;
  showPrice: boolean;
  showCartButton: boolean;
  showMoreButton: boolean;
  moreHref: string;
};

export const PRODUCT_BLOCK_SOURCE_LABELS: Record<ProductBlockSource, string> = {
  all: "全部商品",
  category: "指定商品分類",
  manual: "手動指定商品",
  newest: "最新上架",
  popular: "熱門商品",
};

export const PRODUCT_BLOCK_SORT_LABELS: Record<ProductBlockSort, string> = {
  newest: "最新上架",
  price_asc: "價格由低至高",
  price_desc: "價格由高至低",
  manual: "依我排的順序",
};

export const DEFAULT_PRODUCT_BLOCK: ProductBlockSettings = {
  source: "manual",
  categoryIds: [],
  includeChildCategories: true,
  sort: "newest",
  limit: 8,
  showPrice: true,
  showCartButton: false,
  showMoreButton: true,
  moreHref: "/shop",
};

function isSource(v: unknown): v is ProductBlockSource {
  return v === "all" || v === "category" || v === "manual" || v === "newest" || v === "popular";
}
function isSort(v: unknown): v is ProductBlockSort {
  return v === "newest" || v === "price_asc" || v === "price_desc" || v === "manual";
}

export function parseProductBlockSettings(
  config: Record<string, unknown> | null | undefined,
  fallback?: { displayCount?: number | null; sourceMode?: string | null; viewAllUrl?: string | null }
): ProductBlockSettings {
  const c = (config ?? {}) as Record<string, unknown>;
  const d = DEFAULT_PRODUCT_BLOCK;

  // 舊資料相容：以前只有 source_mode = manual / auto，沒有 product_source。
  const legacyManual = fallback?.sourceMode === "manual";
  const source = isSource(c.product_source)
    ? c.product_source
    : legacyManual
      ? "manual"
      : d.source;

  const rawIds = Array.isArray(c.category_ids) ? c.category_ids : [];
  const categoryIds = rawIds
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);

  const rawLimit = Number(c.limit ?? fallback?.displayCount ?? d.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(48, Math.round(rawLimit)) : d.limit;

  return {
    source,
    categoryIds,
    includeChildCategories: c.include_child_categories !== false,
    sort: isSort(c.product_sort) ? c.product_sort : d.sort,
    limit,
    showPrice: c.show_price !== false,
    showCartButton: c.show_cart_button === true,
    showMoreButton: c.show_more_button !== false,
    moreHref: typeof c.more_href === "string" && c.more_href.trim()
      ? c.more_href.trim()
      : (fallback?.viewAllUrl || d.moreHref),
  };
}

/** 寫回 config 的形狀（只寫這一區塊的鍵，其他鍵保持原狀）。 */
export function productBlockConfigPatch(s: ProductBlockSettings): Record<string, unknown> {
  return {
    product_source: s.source,
    category_ids: s.categoryIds,
    include_child_categories: s.includeChildCategories,
    product_sort: s.sort,
    limit: s.limit,
    show_price: s.showPrice,
    show_cart_button: s.showCartButton,
    show_more_button: s.showMoreButton,
    more_href: s.moreHref,
  };
}

/* ------------------------------------------------------------------ */
/* 挑商品                                                              */
/* ------------------------------------------------------------------ */

export type CategoryLite = { id: string; parent_id?: string | null };

/** 把選到的分類展開成「自己 + 所有子孫」。 */
export function expandCategoryIds(
  selected: string[],
  categories: CategoryLite[] | null | undefined,
  includeChildren: boolean
): Set<string> {
  const out = new Set(selected);
  if (!includeChildren || !categories?.length) return out;
  // 分類階層通常很淺，直接跑到收斂為止。
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parent_id && out.has(c.parent_id) && !out.has(c.id)) {
        out.add(c.id);
        grew = true;
      }
    }
  }
  return out;
}

/** 這個商品是不是屬於其中一個分類（看 M2M、category_id 與 primary_category_id）。 */
export function productInCategories(p: PickableProduct, ids: Set<string>): boolean {
  if (!ids.size) return false;
  if (p.category_id && ids.has(p.category_id)) return true;
  if (p.primary_category_id && ids.has(p.primary_category_id)) return true;
  const links = Array.isArray(p.category_ids) ? p.category_ids : [];
  return links.some((id) => ids.has(id));
}

function priceOf(p: PickableProduct): number {
  return Number(p.sale_price ?? p.website_price ?? p.price ?? 0);
}

function createdAt(p: PickableProduct): string {
  return String(p.created_at ?? "");
}

/**
 * 依設定挑出要顯示的商品。
 * `products` 必須已經是「前台可見」的清單（上架、頻道可見），這裡不放寬任何可見性規則。
 */
export function pickProductsForBlock<T extends PickableProduct>(options: {
  settings: ProductBlockSettings;
  products: T[];
  manualIds?: string[];
  categories?: CategoryLite[] | null;
}): T[] {
  const { settings, products, manualIds = [], categories } = options;
  const all = products ?? [];

  let list: T[];
  switch (settings.source) {
    case "manual": {
      const byId = new Map(all.map((p) => [p.id, p]));
      // 後台排的順序就是顯示順序。
      return manualIds
        .map((id) => byId.get(id))
        .filter((p): p is T => Boolean(p))
        .slice(0, settings.limit);
    }
    case "category": {
      const ids = expandCategoryIds(settings.categoryIds, categories, settings.includeChildCategories);
      list = all.filter((p) => productInCategories(p, ids));
      break;
    }
    case "popular":
      list = all.filter((p) => p.is_popular || p.is_hot);
      break;
    case "newest":
    case "all":
    default:
      list = [...all];
      break;
  }

  const sorted = [...list];
  switch (settings.sort) {
    case "price_asc":
      sorted.sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price_desc":
      sorted.sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "manual":
      // 非手動來源時沒有自訂順序可用，退回上架時間。
      sorted.sort((a, b) => createdAt(b).localeCompare(createdAt(a)));
      break;
    case "newest":
    default:
      sorted.sort((a, b) => createdAt(b).localeCompare(createdAt(a)));
      break;
  }

  return sorted.slice(0, settings.limit);
}

/** 後台／前台共用的空狀態文案。 */
export function productBlockEmptyText(settings: ProductBlockSettings): string {
  if (settings.source === "manual") return "尚未挑選商品，前台不會顯示這一區。";
  if (settings.source === "category" && settings.categoryIds.length === 0) {
    return "尚未指定商品分類，前台不會顯示這一區。";
  }
  return "目前條件沒有符合的商品。";
}
