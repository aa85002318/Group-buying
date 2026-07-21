export type BakingStockStatus = "in_stock" | "low" | "out";

export type BakingStorageType = "ambient" | "chilled" | "frozen";

export type BakingSortOption = "popular" | "newest" | "price_asc" | "price_desc" | "name";

export type BakingPageSize = 24 | 48 | 72;

export interface BakingCatalogRoot {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon_key?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface BakingCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  level: number;
  path: string | null;
  image_url: string | null;
  icon_key: string | null;
  sort_order: number;
  product_count?: number;
}

export interface BakingCategoryTreeNode extends BakingCategory {
  children: BakingCategoryTreeNode[];
}

export interface BakingBrand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface BakingListProduct {
  id: string;
  slug: string;
  name: string;
  sku: string;
  cover_image: string;
  price: number;
  sale_price: number | null;
  brand_name: string;
  stock_status: BakingStockStatus;
  badges: string[];
  primary_variant_name?: string;
}

export interface BakingProductFilters {
  q?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  storage?: BakingStorageType;
  sort?: BakingSortOption;
  page?: number;
  pageSize?: BakingPageSize;
}

export interface BakingProductsResult {
  products: BakingListProduct[];
  total: number;
  page: number;
  pageSize: BakingPageSize;
  totalPages: number;
}
