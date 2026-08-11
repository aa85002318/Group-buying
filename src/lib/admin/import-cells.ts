/** Normalize Excel/CSV cell values. SheetJS keeps numeric cells as numbers. */
export function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Number.isInteger(value) || Math.abs(value) >= 1e11) {
      return String(Math.round(value));
    }
    return String(value);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

/** Expand Excel scientific notation when the value is still a safe integer. */
export function normalizeSku(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^\d+\.?\d*e[+-]?\d+$/i.test(raw)) {
    const n = Number(raw);
    if (Number.isFinite(n) && n <= Number.MAX_SAFE_INTEGER) {
      return String(Math.round(n));
    }
  }
  if (/^\d+\.0+$/.test(raw)) return raw.replace(/\.0+$/, "");
  return raw;
}

export function pickImportValue(row: Record<string, unknown>, ...keys: string[]): string {
  const exact = new Map(Object.entries(row).map(([key, value]) => [key.trim(), value]));
  for (const key of keys) {
    const value = cellText(exact.get(key));
    if (value) return value;
  }

  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value])
  );
  for (const key of keys) {
    const value = cellText(normalized.get(key.toLowerCase()));
    if (value) return value;
  }
  return "";
}

const IMPORT_FIELD_ALIASES: Record<string, string[]> = {
  product_name: ["product_name", "名稱", "商品名稱", "name"],
  product_slug: ["product_slug", "slug"],
  product_sku: ["product_sku", "SKU", "sku", "商品編號"],
  brand: ["brand", "品牌"],
  supplier: ["supplier", "supplier_name", "廠商", "供應商"],
  category_path: ["category_path", "分類", "category"],
  additional_categories: ["additional_categories"],
  variant_name: ["variant_name", "規格"],
  variant_sku: ["variant_sku"],
  price: ["price", "售價", "團購價"],
  sale_price: ["sale_price", "特價"],
  stock: ["stock", "現貨"],
  safety_stock: ["safety_stock", "安全庫存"],
  storage_type: ["storage_type", "溫層", "temperature"],
  image_url: ["image_url", "圖片", "image"],
  status: ["status", "狀態"],
  tags: ["tags", "標籤"],
  search_keywords: ["search_keywords", "搜尋關鍵字"],
};

/** Map Chinese / English Excel headers onto the baking-import field names. */
export function canonicalizeImportRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(IMPORT_FIELD_ALIASES)) {
    let value = pickImportValue(row, ...aliases);
    if (field === "price" && !value) {
      value = pickImportValue(row, "成本", "cost");
    }
    if (field === "product_sku" || field === "variant_sku") {
      value = normalizeSku(value);
    }
    if (field === "storage_type") {
      const shifted = pickImportValue(row, "影片", "video");
      if (!/常溫|冷藏|冷凍|ambient|chilled|frozen/i.test(value) && /常溫|冷藏|冷凍/.test(shifted)) {
        value = shifted;
      }
    }
    out[field] = value;
  }
  return out;
}

/** Convert Excel serial dates (e.g. 46022) or ISO-like strings to YYYY-MM-DD. */
export function toIsoDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const serial = Number(raw);
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const utc = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!Number.isNaN(utc.getTime())) return utc.toISOString().slice(0, 10);
  }
  return raw;
}
