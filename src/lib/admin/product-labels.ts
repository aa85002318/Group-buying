/** Product price label printing — types & helpers. */

export type LabelPriceSource = "app" | "suggested" | "store" | "custom" | "vip";
export type LabelBarcodeType = "CODE128" | "EAN13" | "QR";
export type LabelPriceWeight = "normal" | "bold" | "black";
export type LabelStyleVariant =
  | "standard"
  | "sale"
  | "vip"
  | "wholesale"
  | "minimal"
  | "simple"
  | "app_month";
export type LabelPaperMode = "label" | "a4";
export type PriceLabelTemplateCode = "simple" | "app_month" | "sale";

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
  /** Black/white thermal label preset (70×30) */
  monochrome?: boolean;
};

export type LabelProduct = {
  id: string;
  name: string;
  subtitle?: string | null;
  barcode?: string | null;
  sku?: string | null;
  unit?: string | null;
  specifications?: string | null;
  weight_grams?: number | null;
  price: number;
  sale_price?: number | null;
  /** App 本月優惠價（獨立欄位） */
  app_price?: number | null;
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

export type PriceLabelPrintItem = {
  productId: string;
  productName: string;
  spec?: string;
  weight?: string;
  barcode: string;
  price?: number;
  appPrice?: number;
  salePrice?: number;
  copies: number;
};

export type PriceLabelPrintRequest = {
  templateCode: PriceLabelTemplateCode;
  widthMm: number;
  heightMm: number;
  items: PriceLabelPrintItem[];
};

export const SIZE_PRESETS = [
  { label: "50×30", width: 50, height: 30 },
  { label: "70×30", width: 70, height: 30 },
  { label: "100×50", width: 100, height: 50 },
  { label: "100×100", width: 100, height: 100 },
] as const;

const MONO_BASE = {
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
  name_font_size: 11,
  price_font_size: 22,
  barcode_font_size: 8,
  price_font_weight: "black" as LabelPriceWeight,
  barcode_type: "CODE128" as LabelBarcodeType,
  monochrome: true,
};

/** 三個黑白熱感公版（前端常數；亦會寫入 label_templates） */
export const PRICE_LABEL_TEMPLATES: LabelTemplateConfig[] = [
  {
    ...MONO_BASE,
    name: "簡約版",
    code: "simple",
    style_variant: "simple",
    is_default: true,
  },
  {
    ...MONO_BASE,
    name: "本月 App 優惠版",
    code: "app_month",
    style_variant: "app_month",
    show_promo_text: true,
    promo_text: "本月 APP 優惠",
    is_default: false,
  },
  {
    ...MONO_BASE,
    name: "特價版",
    code: "sale",
    style_variant: "sale",
    show_promo_text: true,
    promo_text: "特價",
    is_default: false,
  },
];

/** 既有彩色／可調版型（保留） */
export const CLASSIC_TEMPLATES: LabelTemplateConfig[] = [
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
    monochrome: false,
  },
  {
    name: "特價（經典）",
    code: "sale_classic",
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
    monochrome: false,
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
    monochrome: false,
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
    monochrome: false,
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
    monochrome: false,
  },
];

export const BUILTIN_TEMPLATES: LabelTemplateConfig[] = [
  ...PRICE_LABEL_TEMPLATES,
  ...CLASSIC_TEMPLATES,
];

export function isPriceLabelTemplateCode(code?: string | null): code is PriceLabelTemplateCode {
  return code === "simple" || code === "app_month" || code === "sale";
}

export function getAppPrice(product: LabelProduct): number | null {
  if (product.app_price == null || Number.isNaN(Number(product.app_price))) return null;
  return Number(product.app_price);
}

export function getSalePrice(product: LabelProduct): number | null {
  if (product.sale_price == null || Number.isNaN(Number(product.sale_price))) return null;
  const sale = Number(product.sale_price);
  if (sale <= 0) return null;
  const list = Number(product.price ?? 0);
  const original =
    product.original_price != null ? Number(product.original_price) : null;
  // 特價版：需低於一般售價或原價，避免 sale_price 預設等於 price 被當成特價
  if (list > 0 && sale < list) return sale;
  if (original != null && original > 0 && sale < original) return sale;
  if (list > 0 && sale >= list) return null;
  return sale;
}

export function getListPrice(product: LabelProduct): number {
  return Number(product.price ?? 0);
}

export function productMissingForTemplate(
  product: LabelProduct,
  templateCode?: string | null
): string | null {
  if (templateCode === "simple") {
    if (!(getListPrice(product) > 0)) return "尚未設定一般售價";
    return null;
  }
  if (templateCode === "app_month") {
    if (getAppPrice(product) == null) return "尚未設定 App 優惠價";
    return null;
  }
  if (templateCode === "sale") {
    const sale = getSalePrice(product);
    if (sale == null) return "尚未設定特價";
    if (!(getListPrice(product) > 0)) return "尚未設定一般售價";
    return null;
  }
  return null;
}

export function resolveLabelPrice(
  product: LabelProduct,
  source: LabelPriceSource,
  customPrice: number | null
): { price: number; comparePrice: number | null; label: string } {
  const appPromo = getAppPrice(product);
  const app = Number(appPromo ?? product.sale_price ?? product.price ?? 0);
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

export function formatSpecOrWeight(product: LabelProduct): string | null {
  const weight = formatWeight(product.weight_grams, product.unit);
  const spec = product.specifications?.trim() || null;
  if (weight && spec && weight !== spec) return `${spec}／${weight}`;
  return weight || spec;
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

export function toPriceLabelPrintItems(
  items: PrintQueueItem[],
  templateCode: PriceLabelTemplateCode
): PriceLabelPrintItem[] {
  return items
    .filter((q) => !productMissingForTemplate(q.product, templateCode))
    .map((q) => ({
      productId: q.product.id,
      productName: q.product.name,
      spec: q.product.specifications ?? undefined,
      weight: formatWeight(q.product.weight_grams, q.product.unit) ?? undefined,
      barcode: q.product.barcode ?? "",
      price: getListPrice(q.product) || undefined,
      appPrice: getAppPrice(q.product) ?? undefined,
      salePrice: getSalePrice(q.product) ?? undefined,
      copies: Math.max(1, Math.min(99, q.copies || 1)),
    }));
}

export function mergeTemplatesWithBuiltins(
  fromDb: LabelTemplateConfig[] | null | undefined
): LabelTemplateConfig[] {
  const byCode = new Map<string, LabelTemplateConfig>();
  for (const t of BUILTIN_TEMPLATES) {
    if (t.code) byCode.set(t.code, t);
  }
  for (const t of fromDb ?? []) {
    if (!t.code) continue;
    // Prefer frontend monochrome presets for the three public templates
    if (isPriceLabelTemplateCode(t.code)) {
      const builtin = byCode.get(t.code);
      byCode.set(t.code, { ...builtin!, ...t, monochrome: true, code: t.code });
      continue;
    }
    byCode.set(t.code, { ...t, monochrome: Boolean(t.monochrome) });
  }
  // Stable order: price label presets first, then the rest
  const mono = PRICE_LABEL_TEMPLATES.map((t) => byCode.get(t.code!)!).filter(Boolean);
  const rest = Array.from(byCode.values()).filter((t) => !isPriceLabelTemplateCode(t.code));
  return [...mono, ...rest];
}

export const FIELD_TOGGLES: Array<{
  key: LabelFieldKey;
  label: string;
  configKey: keyof LabelTemplateConfig;
}> = [
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
