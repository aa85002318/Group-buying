/** Product price label printing — types & helpers (Phase 1). */

export type LabelPriceSource = "app" | "suggested" | "store" | "custom" | "vip";
export type LabelBarcodeType = "CODE128" | "EAN13" | "QR";
export type LabelPriceWeight = "normal" | "bold" | "black";
export type LabelStyleVariant = "standard" | "sale" | "vip" | "wholesale" | "minimal";
export type LabelPaperMode = "label" | "a4";

export type LabelFieldKey =
  | "name"
  | "spec"
  | "weight"
  | "price"
  | "barcode"
  | "brand"
  | "sku"
  | "promo"
  | "qrcode"
  | "origin"
  | "expiry"
  | "logo";

export type LabelTemplateConfig = {
  id?: string;
  name: string;
  code?: string | null;
  width_mm: number;
  height_mm: number;
  show_name: boolean;
  show_price: boolean;
  show_barcode: boolean;
  show_weight: boolean;
  show_spec: boolean;
  show_brand: boolean;
  show_sku: boolean;
  show_qrcode: boolean;
  show_promo_text: boolean;
  show_origin: boolean;
  show_expiry: boolean;
  show_logo: boolean;
  name_font_size: number;
  price_font_size: number;
  barcode_font_size: number;
  price_font_weight: LabelPriceWeight;
  barcode_type: LabelBarcodeType;
  style_variant: LabelStyleVariant;
  promo_text?: string | null;
  is_default?: boolean;
};

export type LabelProduct = {
  id: string;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  unit?: string | null;
  specifications?: string | null;
  weight_grams?: number | null;
  price: number;
  sale_price?: number | null;
  original_price?: number | null;
  msrp?: number | null;
  website_price?: number | null;
  vip_price?: number | null;
  is_active?: boolean;
  status?: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  category_name?: string | null;
  supplier_name?: string | null;
  created_at?: string | null;
  origin?: string | null;
};

export type PrintQueueItem = {
  product: LabelProduct;
  copies: number;
  priceSource: LabelPriceSource;
  customPrice: number | null;
  promoText: string | null;
};

export const SIZE_PRESETS = [
  { label: "50×30", width: 50, height: 30 },
  { label: "70×30", width: 70, height: 30 },
  { label: "100×50", width: 100, height: 50 },
  { label: "100×100", width: 100, height: 100 },
] as const;

export const BUILTIN_TEMPLATES: LabelTemplateConfig[] = [
  {
    name: "一般價格牌",
    code: "standard",
    width_mm: 70,
    height_mm: 30,
    show_name: true,
    show_price: true,
    show_barcode: true,
    show_weight: true,
    show_spec: true,
    show_brand: false,
    show_sku: false,
    show_qrcode: false,
    show_promo_text: false,
    show_origin: false,
    show_expiry: false,
    show_logo: false,
    name_font_size: 14,
    price_font_size: 28,
    barcode_font_size: 10,
    price_font_weight: "bold",
    barcode_type: "CODE128",
    style_variant: "standard",
    is_default: true,
  },
  {
    name: "特價",
    code: "sale",
    width_mm: 70,
    height_mm: 30,
    show_name: true,
    show_price: true,
    show_barcode: true,
    show_weight: true,
    show_spec: false,
    show_brand: false,
    show_sku: false,
    show_qrcode: false,
    show_promo_text: true,
    show_origin: false,
    show_expiry: false,
    show_logo: false,
    name_font_size: 13,
    price_font_size: 30,
    barcode_font_size: 10,
    price_font_weight: "black",
    barcode_type: "CODE128",
    style_variant: "sale",
    promo_text: "SALE",
  },
  {
    name: "會員價",
    code: "vip",
    width_mm: 70,
    height_mm: 30,
    show_name: true,
    show_price: true,
    show_barcode: true,
    show_weight: false,
    show_spec: false,
    show_brand: false,
    show_sku: false,
    show_qrcode: false,
    show_promo_text: true,
    show_origin: false,
    show_expiry: false,
    show_logo: false,
    name_font_size: 13,
    price_font_size: 28,
    barcode_font_size: 10,
    price_font_weight: "bold",
    barcode_type: "CODE128",
    style_variant: "vip",
    promo_text: "VIP",
  },
  {
    name: "大量批發",
    code: "wholesale",
    width_mm: 70,
    height_mm: 40,
    show_name: true,
    show_price: true,
    show_barcode: true,
    show_weight: true,
    show_spec: true,
    show_brand: false,
    show_sku: false,
    show_qrcode: false,
    show_promo_text: true,
    show_origin: false,
    show_expiry: false,
    show_logo: false,
    name_font_size: 14,
    price_font_size: 26,
    barcode_font_size: 10,
    price_font_weight: "bold",
    barcode_type: "CODE128",
    style_variant: "wholesale",
    promo_text: "整箱優惠",
  },
  {
    name: "極簡",
    code: "minimal",
    width_mm: 50,
    height_mm: 30,
    show_name: true,
    show_price: true,
    show_barcode: true,
    show_weight: false,
    show_spec: false,
    show_brand: false,
    show_sku: false,
    show_qrcode: false,
    show_promo_text: false,
    show_origin: false,
    show_expiry: false,
    show_logo: false,
    name_font_size: 12,
    price_font_size: 26,
    barcode_font_size: 9,
    price_font_weight: "bold",
    barcode_type: "CODE128",
    style_variant: "minimal",
  },
];

export function resolveLabelPrice(
  product: LabelProduct,
  source: LabelPriceSource,
  customPrice: number | null
): { price: number; comparePrice: number | null; label: string } {
  const app = Number(product.sale_price ?? product.price ?? 0);
  const suggested = Number(product.msrp ?? product.original_price ?? product.price ?? 0);
  const store = Number(product.website_price ?? product.price ?? 0);
  const vip = Number(product.vip_price ?? product.sale_price ?? product.price ?? 0);
  const list = Number(product.original_price ?? product.msrp ?? product.price ?? 0);

  switch (source) {
    case "custom":
      return {
        price: Number(customPrice ?? app),
        comparePrice: list > Number(customPrice ?? app) ? list : null,
        label: "自訂售價",
      };
    case "suggested":
      return { price: suggested, comparePrice: null, label: "建議售價" };
    case "store":
      return {
        price: store,
        comparePrice: list > store ? list : null,
        label: "門市售價",
      };
    case "vip":
      return {
        price: vip,
        comparePrice: app > vip ? app : list > vip ? list : null,
        label: "會員價",
      };
    case "app":
    default:
      return {
        price: app,
        comparePrice: list > app ? list : null,
        label: "App售價",
      };
  }
}

export function formatWeight(grams?: number | null, unit?: string | null): string | null {
  if (grams != null && Number(grams) > 0) {
    const g = Number(grams);
    if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 2)}kg`;
    return `${g}g`;
  }
  if (unit?.trim()) return unit.trim();
  return null;
}

export function formatPriceTwd(n: number): string {
  const rounded = Math.round(Number(n) || 0);
  return `$${rounded.toLocaleString("zh-TW")}`;
}

export function expandQueueForPrint(items: PrintQueueItem[]): PrintQueueItem[] {
  const out: PrintQueueItem[] = [];
  for (const item of items) {
    const copies = Math.max(1, Math.min(99, Math.floor(item.copies) || 1));
    for (let i = 0; i < copies; i += 1) out.push({ ...item, copies: 1 });
  }
  return out;
}

export const FIELD_TOGGLES: Array<{ key: LabelFieldKey; label: string; configKey: keyof LabelTemplateConfig }> = [
  { key: "name", label: "商品名稱", configKey: "show_name" },
  { key: "spec", label: "規格", configKey: "show_spec" },
  { key: "weight", label: "重量", configKey: "show_weight" },
  { key: "price", label: "售價", configKey: "show_price" },
  { key: "barcode", label: "條碼", configKey: "show_barcode" },
  { key: "brand", label: "品牌", configKey: "show_brand" },
  { key: "sku", label: "SKU", configKey: "show_sku" },
  { key: "promo", label: "促銷文字", configKey: "show_promo_text" },
  { key: "qrcode", label: "QR Code", configKey: "show_qrcode" },
  { key: "origin", label: "產地", configKey: "show_origin" },
  { key: "expiry", label: "有效日期", configKey: "show_expiry" },
  { key: "logo", label: "CHIMEIDIY Logo", configKey: "show_logo" },
];
