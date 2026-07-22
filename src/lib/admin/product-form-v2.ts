import type { Product, ProductScope, ProductStatus } from "@/lib/types/database";

export type InventoryMode = "stock" | "preorder" | "both";

export type ProductVideo = {
  id: string;
  title: string;
  url: string;
  video_type: "youtube" | "mp4";
  cover_url: string;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  name: string;
  value: string;
  price_adjustment: string;
  stock: string;
  sort_order: number;
};

export type ProductBatch = {
  id: string;
  batch_number: string;
  expiry_date: string;
  arrival_date: string;
  supplier_id: string;
  quantity: string;
  note: string;
};

export type AdminProductFormV2 = {
  name: string;
  subtitle: string;
  sku: string;
  product_scope: ProductScope;
  category_ids: string[];
  brand_id: string;
  supplier_id: string;
  status: ProductStatus;
  sort_order: string;
  is_featured: boolean;
  is_hot: boolean;
  is_new: boolean;
  is_weekly_pick: boolean;
  is_closing_soon: boolean;
  images: string[];
  videos: ProductVideo[];
  inventory_mode: InventoryMode;
  stock: string;
  preorder_stock: string;
  safety_stock: string;
  min_stock_alert: string;
  expected_arrival_date: string;
  preorder_note: string;
  auto_deduct_stock: boolean;
  allow_oversell: boolean;
  temp_ambient: boolean;
  temp_chilled: boolean;
  temp_frozen: boolean;
  ship_home: boolean;
  ship_cvs: boolean;
  ship_store_pickup: boolean;
  weight_grams: string;
  dimensions: string;
  pickup_store_ids: string[];
  rich_description: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  slug: string;
  tags: string[];
  original_price: string;
  price: string;
  live_price: string;
  vip_price: string;
  cost_price: string;
  variants: ProductVariant[];
  batches: ProductBatch[];
  is_group_buy: boolean;
  group_buy_start_at: string;
  group_buy_end_at: string;
  max_quantity_per_user: string;
  product_info: string;
};

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateSku() {
  return `SKU-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

export const emptyProductFormV2 = (): AdminProductFormV2 => ({
  name: "",
  subtitle: "",
  sku: generateSku(),
  product_scope: "baking",
  category_ids: [],
  brand_id: "",
  supplier_id: "",
  status: "draft",
  sort_order: "0",
  is_featured: false,
  is_hot: false,
  is_new: false,
  is_weekly_pick: false,
  is_closing_soon: false,
  images: [],
  videos: [],
  inventory_mode: "stock",
  stock: "100",
  preorder_stock: "0",
  safety_stock: "10",
  min_stock_alert: "5",
  expected_arrival_date: "",
  preorder_note: "",
  auto_deduct_stock: true,
  allow_oversell: false,
  temp_ambient: true,
  temp_chilled: false,
  temp_frozen: false,
  ship_home: true,
  ship_cvs: false,
  ship_store_pickup: true,
  weight_grams: "",
  dimensions: "",
  pickup_store_ids: [],
  rich_description: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  slug: "",
  tags: [],
  original_price: "",
  price: "",
  live_price: "",
  vip_price: "",
  cost_price: "",
  variants: [],
  batches: [],
  is_group_buy: false,
  group_buy_start_at: "",
  group_buy_end_at: "",
  max_quantity_per_user: "",
  product_info: "",
});

export function calcGrossMarginRate(price: string, cost: string): number | null {
  const p = Number(price);
  const c = Number(cost);
  if (!Number.isFinite(p) || !Number.isFinite(c) || p <= 0) return null;
  return Math.round(((p - c) / p) * 1000) / 10;
}

export function calcGrossMarginAmount(price: string, cost: string): number | null {
  const p = Number(price);
  const c = Number(cost);
  if (!Number.isFinite(p) || !Number.isFinite(c)) return null;
  return Math.round((p - c) * 100) / 100;
}

type ExtendedProduct = Product & {
  pickup_store_ids?: string[];
  category_ids?: string[];
  brand_id?: string | null;
  supplier_id?: string | null;
  subtitle?: string | null;
  sku?: string | null;
  live_price?: number | null;
  vip_price?: number | null;
  tags?: string[];
  is_featured?: boolean;
  is_hot?: boolean;
  is_new?: boolean;
  is_weekly_pick?: boolean;
  is_closing_soon?: boolean;
  inventory_mode?: InventoryMode;
  preorder_stock?: number;
  safety_stock?: number;
  min_stock_alert?: number;
  preorder_note?: string | null;
  auto_deduct_stock?: boolean;
  allow_oversell?: boolean;
  temp_ambient?: boolean;
  temp_chilled?: boolean;
  temp_frozen?: boolean;
  ship_home?: boolean;
  ship_cvs?: boolean;
  ship_store_pickup?: boolean;
  weight_grams?: number | null;
  dimensions?: string | null;
  rich_description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  product_scope?: ProductScope;
  videos?: ProductVideo[];
  variants?: ProductVariant[];
  batches?: ProductBatch[];
};

export function productToFormV2(p: ExtendedProduct): AdminProductFormV2 {
  const images =
    p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [];

  return {
    name: p.name,
    subtitle: p.subtitle ?? "",
    sku: p.sku ?? generateSku(),
    product_scope: p.product_scope ?? "baking",
    category_ids: p.category_ids?.length
      ? p.category_ids
      : p.category_id
        ? [p.category_id]
        : [],
    brand_id: p.brand_id ?? "",
    supplier_id: p.supplier_id ?? "",
    status: p.status ?? (p.is_active ? "active" : "inactive"),
    sort_order: String(p.sort_order ?? 0),
    is_featured: p.is_featured ?? false,
    is_hot: p.is_hot ?? false,
    is_new: p.is_new ?? false,
    is_weekly_pick: p.is_weekly_pick ?? false,
    is_closing_soon: p.is_closing_soon ?? false,
    images,
    videos: p.videos ?? [],
    inventory_mode: p.inventory_mode ?? "stock",
    stock: String(p.stock),
    preorder_stock: String(p.preorder_stock ?? 0),
    safety_stock: String(p.safety_stock ?? 10),
    min_stock_alert: String(p.min_stock_alert ?? 5),
    expected_arrival_date: p.expected_arrival_date
      ? new Date(p.expected_arrival_date).toISOString().slice(0, 10)
      : "",
    preorder_note: p.preorder_note ?? "",
    auto_deduct_stock: p.auto_deduct_stock ?? true,
    allow_oversell: p.allow_oversell ?? false,
    temp_ambient: p.temp_ambient ?? true,
    temp_chilled: p.temp_chilled ?? false,
    temp_frozen: p.temp_frozen ?? false,
    ship_home: p.ship_home ?? true,
    ship_cvs: p.ship_cvs ?? false,
    ship_store_pickup: p.ship_store_pickup ?? true,
    weight_grams: p.weight_grams != null ? String(p.weight_grams) : "",
    dimensions: p.dimensions ?? "",
    pickup_store_ids: p.pickup_store_ids ?? [],
    rich_description: p.rich_description ?? p.description ?? "",
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    seo_keywords: p.seo_keywords ?? "",
    slug: p.slug ?? "",
    tags: Array.isArray(p.tags) ? p.tags : [],
    original_price: p.original_price != null ? String(p.original_price) : "",
    price: String(p.price),
    live_price: p.live_price != null ? String(p.live_price) : "",
    vip_price: p.vip_price != null ? String(p.vip_price) : "",
    cost_price: p.cost_price != null ? String(p.cost_price) : "",
    variants: p.variants ?? [],
    batches: p.batches ?? [],
    is_group_buy: p.is_group_buy ?? false,
    group_buy_start_at: p.group_buy_start_at
      ? new Date(p.group_buy_start_at).toISOString().slice(0, 16)
      : "",
    group_buy_end_at: p.group_buy_end_at
      ? new Date(p.group_buy_end_at).toISOString().slice(0, 16)
      : "",
    max_quantity_per_user:
      p.max_quantity_per_user != null ? String(p.max_quantity_per_user) : "",
    product_info: p.product_info ?? p.disclaimer ?? "",
  };
}

export function formV2ToPayload(form: AdminProductFormV2) {
  const margin = calcGrossMarginAmount(form.price, form.cost_price);
  const isActive = form.status === "active";

  return {
    name: form.name.trim(),
    subtitle: form.subtitle.trim() || null,
    sku: form.sku.trim() || null,
    product_scope: form.product_scope,
    category_id: form.category_ids[0] ?? null,
    category_ids: form.category_ids,
    brand_id: form.brand_id || null,
    supplier_id: form.supplier_id || null,
    status: form.status,
    sort_order: Number(form.sort_order) || 0,
    is_featured: form.is_featured,
    is_hot: form.is_hot,
    is_new: form.is_new,
    is_weekly_pick: form.is_weekly_pick,
    is_closing_soon: form.is_closing_soon,
    images: form.images,
    image_url: form.images[0] ?? null,
    videos: form.videos,
    inventory_mode: form.inventory_mode,
    stock: Number(form.stock) || 0,
    preorder_stock: Number(form.preorder_stock) || 0,
    safety_stock: Number(form.safety_stock) || 0,
    min_stock_alert: Number(form.min_stock_alert) || 0,
    expected_arrival_date: form.expected_arrival_date || null,
    preorder_note: form.preorder_note.trim() || null,
    auto_deduct_stock: form.auto_deduct_stock,
    allow_oversell: form.allow_oversell,
    temp_ambient: form.temp_ambient,
    temp_chilled: form.temp_chilled,
    temp_frozen: form.temp_frozen,
    ship_home: form.ship_home,
    ship_cvs: form.ship_cvs,
    ship_store_pickup: form.ship_store_pickup,
    weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
    dimensions: form.dimensions.trim() || null,
    pickup_store_ids: form.pickup_store_ids,
    rich_description: form.rich_description.trim() || null,
    description: form.rich_description.trim() || null,
    seo_title: form.seo_title.trim() || null,
    seo_description: form.seo_description.trim() || null,
    seo_keywords: form.seo_keywords.trim() || null,
    slug: form.slug.trim() || null,
    tags: form.tags,
    original_price: form.original_price ? Number(form.original_price) : null,
    price: Number(form.price),
    sale_price: form.price ? Number(form.price) : null,
    live_price: form.live_price ? Number(form.live_price) : null,
    vip_price: form.vip_price ? Number(form.vip_price) : null,
    cost_price: form.cost_price ? Number(form.cost_price) : null,
    gross_margin: margin,
    variants: form.variants,
    batches: form.batches,
    is_active: isActive,
    is_group_buy: form.is_group_buy,
    group_buy_start_at: form.is_group_buy && form.group_buy_start_at
      ? new Date(form.group_buy_start_at).toISOString()
      : null,
    group_buy_end_at: form.is_group_buy && form.group_buy_end_at
      ? new Date(form.group_buy_end_at).toISOString()
      : null,
    max_quantity_per_user: form.max_quantity_per_user
      ? Number(form.max_quantity_per_user)
      : null,
    product_info: form.product_info.trim() || null,
    disclaimer: form.product_info.trim() || null,
    supplier_name: null,
  };
}

export function validateProductFormV2(form: AdminProductFormV2): string | null {
  if (!form.name.trim()) return "請填寫商品名稱";
  if (form.category_ids.length === 0) return "請至少選擇一個商品分類";
  if (!form.price || Number(form.price) <= 0) return "請填寫有效的售價";
  if (form.stock === "" || Number(form.stock) < 0) return "請填寫現貨庫存";
  if (form.is_group_buy) {
    if (!form.group_buy_start_at || !form.group_buy_end_at) {
      return "團購商品請填寫開始與結束時間";
    }
    if (new Date(form.group_buy_start_at) >= new Date(form.group_buy_end_at)) {
      return "團購結束時間需晚於開始時間";
    }
  }
  return null;
}

export function createEmptyVideo(): ProductVideo {
  return {
    id: newId("video"),
    title: "",
    url: "",
    video_type: "youtube",
    cover_url: "",
    sort_order: 0,
  };
}

export function createEmptyVariant(): ProductVariant {
  return {
    id: newId("variant"),
    name: "",
    value: "",
    price_adjustment: "0",
    stock: "",
    sort_order: 0,
  };
}

export function createEmptyBatch(): ProductBatch {
  return {
    id: newId("batch"),
    batch_number: "",
    expiry_date: "",
    arrival_date: "",
    supplier_id: "",
    quantity: "0",
    note: "",
  };
}
