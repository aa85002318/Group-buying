import type { Product } from "@/lib/types/database";

export type AdminProductFormState = {
  name: string;
  category_id: string;
  product_scope: "baking" | "chime_select";
  images: string[];
  original_price: string;
  price: string;
  stock: string;
  specifications: string;
  description: string;
  is_active: boolean;
  is_group_buy: boolean;
  group_buy_start_at: string;
  group_buy_end_at: string;
  max_quantity_per_user: string;
  pickup_store_ids: string[];
  supplier_name: string;
  cost_price: string;
  product_info: string;
};

export const emptyProductForm = (): AdminProductFormState => ({
  name: "",
  category_id: "",
  product_scope: "baking",
  images: [],
  original_price: "",
  price: "",
  stock: "100",
  specifications: "",
  description: "",
  is_active: true,
  is_group_buy: false,
  group_buy_start_at: "",
  group_buy_end_at: "",
  max_quantity_per_user: "",
  pickup_store_ids: [],
  supplier_name: "",
  cost_price: "",
  product_info: "",
});

export function calcGrossMargin(price: string, cost: string): number | null {
  const p = Number(price);
  const c = Number(cost);
  if (!Number.isFinite(p) || !Number.isFinite(c)) return null;
  return Math.round((p - c) * 100) / 100;
}

export function productToForm(
  p: Product & { pickup_store_ids?: string[] }
): AdminProductFormState {
  const images =
    p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [];

  return {
    name: p.name,
    category_id: p.category_id ?? "",
    product_scope: p.product_scope ?? "baking",
    images,
    original_price: p.original_price != null ? String(p.original_price) : "",
    price: String(p.price),
    stock: String(p.stock),
    specifications: p.specifications ?? "",
    description: p.description ?? "",
    is_active: p.is_active,
    is_group_buy: p.is_group_buy ?? false,
    group_buy_start_at: p.group_buy_start_at
      ? new Date(p.group_buy_start_at).toISOString().slice(0, 16)
      : "",
    group_buy_end_at: p.group_buy_end_at
      ? new Date(p.group_buy_end_at).toISOString().slice(0, 16)
      : "",
    max_quantity_per_user:
      p.max_quantity_per_user != null ? String(p.max_quantity_per_user) : "",
    pickup_store_ids: p.pickup_store_ids ?? [],
    supplier_name: p.supplier_name ?? "",
    cost_price: p.cost_price != null ? String(p.cost_price) : "",
    product_info: p.product_info ?? p.disclaimer ?? "",
  };
}

export function formToPayload(form: AdminProductFormState) {
  const margin = calcGrossMargin(form.price, form.cost_price);

  return {
    name: form.name.trim(),
    category_id: form.category_id || null,
    product_scope: form.product_scope,
    images: form.images,
    image_url: form.images[0] ?? null,
    original_price: form.original_price ? Number(form.original_price) : null,
    price: Number(form.price),
    sale_price: form.price ? Number(form.price) : null,
    stock: Number(form.stock) || 0,
    specifications: form.specifications.trim() || null,
    description: form.description.trim() || null,
    is_active: form.is_active,
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
    pickup_store_ids: form.pickup_store_ids,
    supplier_name: form.supplier_name.trim() || null,
    cost_price: form.cost_price ? Number(form.cost_price) : null,
    gross_margin: margin,
    product_info: form.product_info.trim() || null,
    disclaimer: form.product_info.trim() || null,
    status: form.is_active ? "active" : "inactive",
  };
}

export function validateProductForm(form: AdminProductFormState): string | null {
  if (!form.name.trim()) return "請填寫商品名稱";
  if (!form.category_id) return "請選擇商品分類";
  if (!form.price || Number(form.price) <= 0) return "請填寫有效的團購價";
  if (form.stock === "" || Number(form.stock) < 0) return "請填寫庫存數量";
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
