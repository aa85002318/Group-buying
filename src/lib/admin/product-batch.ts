import { cleanRichTextHtml } from "@/lib/cms/safeHtml";
import type { ProductStatus } from "@/lib/types/database";

export const PRODUCT_BATCH_SHIP_KEYS = [
  "temp_ambient",
  "temp_chilled",
  "temp_frozen",
  "ship_home",
  "ship_cvs",
  "ship_store_pickup",
] as const;

export type ShipKey = (typeof PRODUCT_BATCH_SHIP_KEYS)[number];

export const SHIP_LABELS: Record<ShipKey, string> = {
  temp_ambient: "常溫宅配",
  temp_chilled: "冷藏宅配",
  temp_frozen: "冷凍宅配",
  ship_home: "宅配",
  ship_cvs: "超商取貨",
  ship_store_pickup: "門市取貨",
};

export type BatchTextOp = "replace" | "prefix" | "suffix" | "search_replace" | "clear";
export type CategoryMode = "replace" | "add" | "remove";
export type ShipMode = "replace" | "add" | "remove";
export type PriceMode = "set" | "add_amount" | "sub_amount" | "add_percent" | "sub_percent";
export type InfoMode = "prefix" | "suffix" | "search_replace" | "clear_paragraph" | "apply_style" | "overwrite";
export type BatchRunMode = "all_or_nothing" | "skip_errors";

export type ProductBatchPatch = {
  status?: { enabled: boolean; value: ProductStatus | "scheduled_publish" | "scheduled_unpublish" };
  name?: { enabled: boolean; op: BatchTextOp; value: string; find?: string };
  subtitle?: { enabled: boolean; op: BatchTextOp; value: string; find?: string };
  sku?: { enabled: boolean; op: "prefix" | "suffix" | "search_replace" | "regenerate"; value: string; find?: string };
  categories?: { enabled: boolean; mode: CategoryMode; categoryIds: string[] };
  shipping?: { enabled: boolean; mode: ShipMode; keys: ShipKey[] };
  price?: {
    enabled: boolean;
    mode: PriceMode;
    value: number;
    round?: boolean;
    includeCost?: boolean;
    costValue?: number;
  };
  info?: { enabled: boolean; mode: InfoMode; value: string; find?: string; templateKey?: string };
};

export type ProductBatchRow = {
  id: string;
  name: string;
  subtitle?: string | null;
  sku?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  price: number;
  sale_price?: number | null;
  cost_price?: number | null;
  category_id?: string | null;
  category_ids?: string[];
  image_url?: string | null;
  images?: unknown;
  rich_description?: string | null;
  description?: string | null;
  product_info?: string | null;
  temp_ambient?: boolean | null;
  temp_chilled?: boolean | null;
  temp_frozen?: boolean | null;
  ship_home?: boolean | null;
  ship_cvs?: boolean | null;
  ship_store_pickup?: boolean | null;
};

export type StyleConfig = {
  h2?: Record<string, string>;
  h3?: Record<string, string>;
  body?: Record<string, string>;
  table?: Record<string, string>;
  callout?: Record<string, string>;
  imageMaxWidth?: string;
  mobileStack?: boolean;
};

export type BatchPreviewItem = {
  productId: string;
  name: string;
  sku: string | null;
  ok: boolean;
  errors: string[];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

function applyTextOp(
  current: string,
  op: BatchTextOp,
  value: string,
  find?: string
): string {
  if (op === "replace") return value;
  if (op === "prefix") return `${value}${current}`;
  if (op === "suffix") return `${current}${value}`;
  if (op === "clear") return "";
  if (op === "search_replace") return current.split(find ?? "").join(value);
  return current;
}

function shipSnapshot(p: ProductBatchRow): Record<ShipKey, boolean> {
  return {
    temp_ambient: p.temp_ambient !== false,
    temp_chilled: Boolean(p.temp_chilled),
    temp_frozen: Boolean(p.temp_frozen),
    ship_home: p.ship_home !== false,
    ship_cvs: Boolean(p.ship_cvs),
    ship_store_pickup: p.ship_store_pickup !== false,
  };
}

export function applyShipping(
  current: Record<ShipKey, boolean>,
  mode: ShipMode,
  keys: ShipKey[]
): Record<ShipKey, boolean> {
  const next = { ...current };
  if (mode === "replace") {
    for (const k of PRODUCT_BATCH_SHIP_KEYS) next[k] = false;
    for (const k of keys) next[k] = true;
  } else if (mode === "add") {
    for (const k of keys) next[k] = true;
  } else {
    for (const k of keys) next[k] = false;
  }
  return next;
}

export function validateShipping(next: Record<ShipKey, boolean>, goingLive: boolean): string[] {
  const errors: string[] = [];
  const hasAny =
    next.temp_ambient ||
    next.temp_chilled ||
    next.temp_frozen ||
    next.ship_home ||
    next.ship_cvs ||
    next.ship_store_pickup;
  if (goingLive && !hasAny) errors.push("上架商品至少要有一種有效配送或取貨方式");
  if (next.temp_frozen && next.temp_ambient && !next.temp_chilled) {
    errors.push("冷凍商品不可只剩常溫配送");
  }
  return errors;
}

export function applyPrice(current: number, mode: PriceMode, value: number, round?: boolean): number {
  let next = current;
  if (mode === "set") next = value;
  else if (mode === "add_amount") next = current + value;
  else if (mode === "sub_amount") next = current - value;
  else if (mode === "add_percent") next = current * (1 + value / 100);
  else if (mode === "sub_percent") next = current * (1 - value / 100);
  if (round) next = Math.round(next);
  return Math.max(0, next);
}

function cssFrom(map?: Record<string, string>): string {
  if (!map) return "";
  return Object.entries(map)
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${prop}: ${v}`;
    })
    .join("; ");
}

export function applyStyleTemplate(html: string, style: StyleConfig): string {
  const safe = cleanRichTextHtml(html || "<p></p>");
  const h2 = cssFrom(style.h2);
  const h3 = cssFrom(style.h3);
  const body = cssFrom(style.body);
  const table = cssFrom(style.table);
  const imgMax = style.imageMaxWidth || "100%";
  const out = safe
    .replace(/<h2(\s[^>]*)?>/gi, `<h2 style="${h2}">`)
    .replace(/<h3(\s[^>]*)?>/gi, `<h3 style="${h3}">`)
    .replace(/<p(\s[^>]*)?>/gi, `<p style="${body}">`)
    .replace(/<table(\s[^>]*)?>/gi, `<table style="${table};width:100%">`)
    .replace(/<img(\s[^>]*)?>/gi, (m) => {
      if (/style=/i.test(m)) return m.replace(/style="([^"]*)"/i, `style="$1;max-width:${imgMax};height:auto"`);
      return m.replace("<img", `<img style="max-width:${imgMax};height:auto"`);
    });
  return `<div data-style-template="1" style="${body}">${out}</div>`;
}

function snapshot(p: ProductBatchRow): Record<string, unknown> {
  return {
    name: p.name,
    subtitle: p.subtitle ?? null,
    sku: p.sku ?? null,
    status: p.status ?? (p.is_active ? "active" : "inactive"),
    is_active: p.is_active !== false,
    price: p.price,
    sale_price: p.sale_price ?? p.price,
    cost_price: p.cost_price ?? null,
    category_id: p.category_id ?? null,
    category_ids: p.category_ids ?? (p.category_id ? [p.category_id] : []),
    image_url: p.image_url ?? null,
    rich_description: p.rich_description ?? p.description ?? null,
    product_info: p.product_info ?? null,
    shipping: shipSnapshot(p),
  };
}

export function mapUiStatus(value: string): { status: ProductStatus; is_active: boolean } {
  if (value === "active" || value === "scheduled_publish") return { status: "active", is_active: true };
  if (value === "draft") return { status: "draft", is_active: false };
  if (value === "sold_out") return { status: "sold_out", is_active: false };
  return { status: "inactive", is_active: false };
}

export function generateRuleSku(current: string, index: number): string {
  const base = (current || "SKU").replace(/[^A-Za-z0-9-]/g, "").slice(0, 12) || "SKU";
  return `${base}-${String(index + 1).padStart(3, "0")}`;
}

export function computeProductPatch(
  product: ProductBatchRow,
  patch: ProductBatchPatch,
  ctx: { index: number; templates: Record<string, StyleConfig> }
): { after: Record<string, unknown>; errors: string[]; db: Record<string, unknown>; categoryIds?: string[] } {
  const before = snapshot(product);
  const after = { ...before };
  const db: Record<string, unknown> = {};
  const errors: string[] = [];
  let categoryIds = [...((before.category_ids as string[]) ?? [])];

  if (patch.name?.enabled) {
    const next = applyTextOp(String(after.name ?? ""), patch.name.op, patch.name.value, patch.name.find);
    if (!next.trim()) errors.push("商品名稱不可空白");
    after.name = next;
    db.name = next;
  }

  if (patch.subtitle?.enabled) {
    const next = applyTextOp(String(after.subtitle ?? ""), patch.subtitle.op, patch.subtitle.value, patch.subtitle.find);
    after.subtitle = next || null;
    db.subtitle = next || null;
  }

  if (patch.sku?.enabled) {
    let next = String(after.sku ?? "");
    if (patch.sku.op === "regenerate") next = generateRuleSku(next, ctx.index);
    else next = applyTextOp(next, patch.sku.op, patch.sku.value, patch.sku.find);
    if (!next.trim()) errors.push("SKU 不可空白");
    after.sku = next;
    db.sku = next;
  }

  if (patch.categories?.enabled) {
    const ids = patch.categories.categoryIds.filter(Boolean);
    if (patch.categories.mode === "replace") categoryIds = ids;
    else if (patch.categories.mode === "add") {
      const set = new Set(categoryIds);
      ids.forEach((id) => set.add(id));
      categoryIds = Array.from(set);
    } else {
      const remove = new Set(ids);
      categoryIds = categoryIds.filter((id) => !remove.has(id));
    }
    after.category_ids = categoryIds;
    after.category_id = categoryIds[0] ?? null;
    db.category_id = categoryIds[0] ?? null;
  }

  if (patch.shipping?.enabled) {
    const next = applyShipping(after.shipping as Record<ShipKey, boolean>, patch.shipping.mode, patch.shipping.keys);
    errors.push(
      ...validateShipping(
        next,
        patch.status?.enabled ? mapUiStatus(patch.status.value).is_active : Boolean(after.is_active)
      )
    );
    after.shipping = next;
    for (const k of PRODUCT_BATCH_SHIP_KEYS) db[k] = next[k];
  }

  if (patch.price?.enabled) {
    if (patch.price.mode.includes("percent") && (patch.price.value < 0 || patch.price.value > 100)) {
      errors.push("百分比須介於 0～100");
    }
    const next = applyPrice(Number(after.price) || 0, patch.price.mode, patch.price.value, patch.price.round);
    after.price = next;
    after.sale_price = next;
    db.price = next;
    db.sale_price = next;
    if (patch.price.includeCost && patch.price.costValue != null) {
      after.cost_price = Math.max(0, patch.price.costValue);
      db.cost_price = after.cost_price;
    }
  }

  if (patch.info?.enabled) {
    const current = String(after.rich_description ?? "");
    let next = current;
    if (patch.info.mode === "prefix") next = `${patch.info.value}${current}`;
    else if (patch.info.mode === "suffix") next = `${current}${patch.info.value}`;
    else if (patch.info.mode === "search_replace") next = current.split(patch.info.find ?? "").join(patch.info.value);
    else if (patch.info.mode === "clear_paragraph") {
      next = current.replace(new RegExp(patch.info.find || patch.info.value, "g"), "");
    } else if (patch.info.mode === "apply_style") {
      const style = ctx.templates[patch.info.templateKey ?? ""];
      if (!style) errors.push("找不到商品資訊樣式公版");
      else next = applyStyleTemplate(current, style);
    } else if (patch.info.mode === "overwrite") {
      next = patch.info.value;
    }
    next = cleanRichTextHtml(next);
    after.rich_description = next || null;
    db.rich_description = next || null;
    db.description = next || null;
  }

  if (patch.status?.enabled) {
    const mapped = mapUiStatus(patch.status.value);
    after.status = mapped.status;
    after.is_active = mapped.is_active;
    db.status = mapped.status;
    db.is_active = mapped.is_active;
    if (mapped.is_active) {
      if (!String(after.name ?? "").trim()) errors.push("上架前需要商品名稱");
      if (!String(after.sku ?? "").trim()) errors.push("上架前需要 SKU");
      if (Number(after.price) < 0) errors.push("售價不可小於 0");
      if (!(after.category_ids as string[]).length) errors.push("上架前至少需要一個分類");
      if (!after.image_url) errors.push("上架前至少需要一張首圖");
    }
  }

  const uniqueErrors = Array.from(new Set(errors));
  return {
    after,
    errors: uniqueErrors,
    db,
    categoryIds: patch.categories?.enabled ? categoryIds : undefined,
  };
}

export function hasEnabledPatch(patch: ProductBatchPatch): boolean {
  return Object.values(patch).some((field) => field && typeof field === "object" && "enabled" in field && field.enabled);
}
