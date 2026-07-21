import { createClient } from "@/lib/supabase/server";
import type {
  BakingBrand,
  BakingCatalogRoot,
  BakingCategory,
  BakingCategoryTreeNode,
  BakingListProduct,
  BakingPageSize,
  BakingProductFilters,
  BakingProductsResult,
  BakingSortOption,
  BakingStockStatus,
} from "@/lib/baking-materials/types";

const DEFAULT_PAGE_SIZE: BakingPageSize = 24;
const LOW_STOCK_THRESHOLD = 10;

const PRODUCT_LIST_FIELDS =
  "id, slug, name, sku, image_url, price, sale_price, original_price, stock, is_new, is_hot, brand_id, primary_category_id, storage_type, status, is_active, min_price, max_price, created_at, updated_at, brands(name, slug)";

type DbCategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  level: number;
  path: string | null;
  banner_url?: string | null;
  icon_key?: string | null;
  sort_order: number;
  catalog_root_id?: string | null;
  is_active?: boolean;
};

type DbProductRow = {
  id: string;
  slug: string | null;
  name: string;
  sku: string | null;
  image_url: string | null;
  price: number;
  sale_price: number | null;
  original_price: number | null;
  stock: number;
  is_new: boolean | null;
  is_hot: boolean | null;
  brand_id: string | null;
  primary_category_id: string | null;
  storage_type: string | null;
  status: string | null;
  is_active: boolean;
  min_price: number | null;
  max_price: number | null;
  created_at: string;
  updated_at: string;
  brands?: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

function emptyProductsResult(page = 1, pageSize: BakingPageSize = DEFAULT_PAGE_SIZE): BakingProductsResult {
  return { products: [], total: 0, page, pageSize, totalPages: 0 };
}

function mapCategory(row: DbCategoryRow): BakingCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parent_id: row.parent_id,
    level: row.level,
    path: row.path,
    image_url: row.banner_url ?? null,
    icon_key: row.icon_key ?? null,
    sort_order: row.sort_order,
  };
}

function resolveBrandName(brands: DbProductRow["brands"]): string {
  if (!brands) return "";
  if (Array.isArray(brands)) return brands[0]?.name ?? "";
  return brands.name ?? "";
}

function mapStockStatus(stock: number): BakingStockStatus {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "in_stock";
}

function buildBadges(row: DbProductRow): string[] {
  const badges: string[] = [];
  if (row.is_new) badges.push("新品");
  if (row.is_hot) badges.push("熱門");
  if (row.storage_type === "chilled") badges.push("冷藏");
  if (row.storage_type === "frozen") badges.push("冷凍");
  const listPrice = row.price ?? row.original_price ?? 0;
  if (row.sale_price != null && row.sale_price < listPrice) badges.push("特價");
  return badges;
}

function mapListProduct(row: DbProductRow): BakingListProduct {
  const listPrice = row.price ?? row.original_price ?? row.min_price ?? 0;
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    name: row.name,
    sku: row.sku ?? "",
    cover_image: row.image_url ?? "",
    price: listPrice,
    sale_price: row.sale_price,
    brand_name: resolveBrandName(row.brands),
    stock_status: mapStockStatus(row.stock ?? 0),
    badges: buildBadges(row),
  };
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,]/g, "\\$&");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export function getCategoryTree(categories: BakingCategory[]): BakingCategoryTreeNode[] {
  const nodes = new Map<string, BakingCategoryTreeNode>();
  const roots: BakingCategoryTreeNode[] = [];

  for (const category of categories) {
    nodes.set(category.id, { ...category, children: [] });
  }

  for (const category of categories) {
    const node = nodes.get(category.id);
    if (!node) continue;
    if (category.parent_id && nodes.has(category.parent_id)) {
      nodes.get(category.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list: BakingCategoryTreeNode[]) => {
    list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "zh-Hant"));
    for (const node of list) sortNodes(node.children);
  };
  sortNodes(roots);
  return roots;
}

export function parseBakingFiltersFromSearchParams(sp: URLSearchParams): BakingProductFilters {
  const pageSizeRaw = Number(sp.get("pageSize"));
  const pageSize: BakingPageSize | undefined =
    pageSizeRaw === 48 || pageSizeRaw === 72 ? pageSizeRaw : pageSizeRaw === 24 ? 24 : undefined;

  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  const sort = sp.get("sort") as BakingSortOption | null;
  const storage = sp.get("storage");

  return {
    q: sp.get("q")?.trim() || undefined,
    brand: sp.get("brand")?.trim() || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStock: sp.get("inStock") === "1" || sp.get("inStock") === "true",
    onSale: sp.get("onSale") === "1" || sp.get("onSale") === "true",
    isNew: sp.get("isNew") === "1" || sp.get("isNew") === "true",
    isHot: sp.get("isHot") === "1" || sp.get("isHot") === "true",
    storage:
      storage === "ambient" || storage === "chilled" || storage === "frozen" ? storage : undefined,
    sort:
      sort === "popular" ||
      sort === "newest" ||
      sort === "price_asc" ||
      sort === "price_desc" ||
      sort === "name"
        ? sort
        : undefined,
    page: Math.max(1, Number(sp.get("page") ?? 1) || 1),
    pageSize,
  };
}

export async function getBakingMaterialRoot(): Promise<BakingCatalogRoot | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("catalog_roots")
      .select("id, name, slug, description, image_url, icon_key, sort_order, is_active")
      .eq("slug", "baking-materials")
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return data as BakingCatalogRoot;
  } catch {
    return null;
  }
}

export async function getBakingMaterialCategories(): Promise<BakingCategory[]> {
  try {
    const root = await getBakingMaterialRoot();
    if (!root) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select(
        "id, name, slug, parent_id, level, path, banner_url, icon_key, sort_order, catalog_root_id, is_active"
      )
      .eq("catalog_root_id", root.id)
      .eq("is_active", true)
      .gte("level", 1)
      .lte("level", 3)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) return [];
    return (data as DbCategoryRow[]).map(mapCategory);
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<BakingCategory | null> {
  try {
    const root = await getBakingMaterialRoot();
    if (!root) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select(
        "id, name, slug, parent_id, level, path, banner_url, icon_key, sort_order, catalog_root_id, is_active"
      )
      .eq("catalog_root_id", root.id)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return mapCategory(data as DbCategoryRow);
  } catch {
    return null;
  }
}

export async function getBrandsForCatalog(): Promise<BakingBrand[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) return [];
    return data as BakingBrand[];
  } catch {
    return [];
  }
}

async function getBakingCategoryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rootId: string,
  categorySlug?: string
): Promise<string[] | null> {
  if (!categorySlug) return null;

  const { data: category } = await supabase
    .from("product_categories")
    .select("id, path")
    .eq("catalog_root_id", rootId)
    .eq("slug", categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!category?.path) return [];

  const { data: descendants } = await supabase
    .from("product_categories")
    .select("id")
    .eq("catalog_root_id", rootId)
    .eq("is_active", true)
    .like("path", `${category.path}%`);

  return (descendants ?? []).map((row) => row.id as string);
}

async function getAllBakingCategoryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rootId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("product_categories")
    .select("id")
    .eq("catalog_root_id", rootId)
    .eq("is_active", true);

  return (data ?? []).map((row) => row.id as string);
}

async function getLinkedProductIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryIds: string[]
): Promise<string[]> {
  if (categoryIds.length === 0) return [];

  const { data } = await supabase
    .from("product_category_links")
    .select("product_id")
    .in("category_id", categoryIds);

  return Array.from(new Set((data ?? []).map((row) => row.product_id as string)));
}

function applyCatalogScope<T extends { or: (filters: string) => T }>(
  query: T,
  categoryIds: string[],
  linkedProductIds: string[]
): T {
  const parts = [`primary_category_id.in.(${categoryIds.join(",")})`];
  if (linkedProductIds.length > 0) {
    parts.push(`id.in.(${linkedProductIds.join(",")})`);
  }
  return query.or(parts.join(","));
}

function applyMinPriceFilter<T extends { or: (filters: string) => T }>(query: T, minPrice: number): T {
  return query.or(
    [
      `sale_price.gte.${minPrice}`,
      `and(sale_price.is.null,min_price.gte.${minPrice})`,
      `and(sale_price.is.null,min_price.is.null,price.gte.${minPrice})`,
    ].join(",")
  );
}

function applyMaxPriceFilter<T extends { or: (filters: string) => T }>(query: T, maxPrice: number): T {
  return query.or(
    [
      `sale_price.lte.${maxPrice}`,
      `and(sale_price.is.null,min_price.lte.${maxPrice})`,
      `and(sale_price.is.null,min_price.is.null,price.lte.${maxPrice})`,
    ].join(",")
  );
}

function applySort<T extends { order: (column: string, options: { ascending: boolean }) => T }>(
  query: T,
  sort: BakingSortOption = "popular"
): T {
  switch (sort) {
    case "newest":
      return query.order("created_at", { ascending: false });
    case "price_asc":
      return query.order("price", { ascending: true }).order("name", { ascending: true });
    case "price_desc":
      return query.order("price", { ascending: false }).order("name", { ascending: true });
    case "name":
      return query.order("name", { ascending: true });
    case "popular":
    default:
      return query.order("is_hot", { ascending: false }).order("updated_at", { ascending: false });
  }
}

export async function searchBakingProducts(
  filters: BakingProductFilters
): Promise<BakingProductsResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize: BakingPageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  try {
    const root = await getBakingMaterialRoot();
    if (!root) return emptyProductsResult(page, pageSize);

    const supabase = await createClient();
    const allCategoryIds = await getAllBakingCategoryIds(supabase, root.id);
    if (allCategoryIds.length === 0) return emptyProductsResult(page, pageSize);

    const scopedCategoryIds =
      (await getBakingCategoryIds(supabase, root.id, filters.categorySlug)) ?? allCategoryIds;
    if (scopedCategoryIds.length === 0) return emptyProductsResult(page, pageSize);

    const linkedProductIds = await getLinkedProductIds(supabase, scopedCategoryIds);

    let query = supabase
      .from("products")
      .select(PRODUCT_LIST_FIELDS, { count: "exact" })
      .eq("is_active", true)
      .or("status.is.null,status.eq.active");

    query = applyCatalogScope(query, scopedCategoryIds, linkedProductIds);

    if (filters.brand) {
      if (isUuid(filters.brand)) {
        query = query.eq("brand_id", filters.brand);
      } else {
        const { data: brand } = await supabase
          .from("brands")
          .select("id")
          .eq("slug", filters.brand)
          .eq("is_active", true)
          .maybeSingle();
        if (!brand?.id) return emptyProductsResult(page, pageSize);
        query = query.eq("brand_id", brand.id);
      }
    }

    if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
      query = applyMinPriceFilter(query, filters.minPrice);
    }
    if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
      query = applyMaxPriceFilter(query, filters.maxPrice);
    }
    if (filters.inStock) query = query.gt("stock", 0);
    if (filters.onSale) query = query.not("sale_price", "is", null);
    if (filters.isNew) query = query.eq("is_new", true);
    if (filters.isHot) query = query.eq("is_hot", true);
    if (filters.storage) query = query.eq("storage_type", filters.storage);

    if (filters.q) {
      const keyword = escapeIlike(filters.q.trim());
      query = query.or(`name.ilike.%${keyword}%,sku.ilike.%${keyword}%`);
    }

    query = applySort(query, filters.sort ?? "popular");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) return emptyProductsResult(page, pageSize);

    let rows = (data ?? []) as DbProductRow[];
    if (filters.onSale) {
      rows = rows.filter((row) => {
        const listPrice = row.price ?? row.original_price ?? 0;
        return row.sale_price != null && row.sale_price < listPrice;
      });
    }

    const total = count ?? rows.length;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    return {
      products: rows.map(mapListProduct),
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch {
    return emptyProductsResult(page, pageSize);
  }
}
