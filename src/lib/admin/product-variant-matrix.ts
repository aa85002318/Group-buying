/**
 * Multi-spec SKU matrix helpers.
 * Option groups (樣式) × values (選項) → cartesian product variants.
 * Persists to product_variants + products.variant_option_groups.
 */

export const MAX_OPTION_GROUPS = 5;
export const MAX_OPTIONS_PER_GROUP = 40;
export const MAX_VARIANTS = 500;
/** Alias used by ProductSpecBuilder */
export const MAX_VARIANT_COMBINATIONS = MAX_VARIANTS;

export type ProductOptionValue = {
  id: string;
  label: string;
  sort_order: number;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  sort_order: number;
  values: ProductOptionValue[];
};

export type VariantOptionGroup = ProductOptionGroup;
export type VariantOptionValue = ProductOptionValue;

/** Expanded variant row for admin matrix (maps to product_variants). */
export type ProductVariantRow = {
  id: string;
  /** Stable key from sorted option value ids */
  combination_key: string;
  /** optionGroupId → optionValueId */
  option_values: Record<string, string>;
  /** Display: "三溫糖1kg × 單包" */
  value: string;
  /** First group name or "規格" — storefront label group */
  name: string;
  sku: string;
  barcode: string;
  price: string;
  sale_price: string;
  cost_price: string;
  price_adjustment: string;
  stock: string;
  weight_grams: string;
  image_url: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
};

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyOptionGroup(
  nameOrIndex: string | number = 0,
  indexArg?: number
): ProductOptionGroup {
  const name =
    typeof nameOrIndex === "string"
      ? nameOrIndex
      : nameOrIndex === 0
        ? "規格"
        : "";
  const index = typeof nameOrIndex === "number" ? nameOrIndex : indexArg ?? 0;
  return {
    id: newId("og"),
    name,
    sort_order: index,
    values: [],
  };
}

export function createEmptyOptionValue(
  labelOrIndex: string | number = 0,
  indexArg?: number
): ProductOptionValue {
  const label = typeof labelOrIndex === "string" ? labelOrIndex : "";
  const index = typeof labelOrIndex === "number" ? labelOrIndex : indexArg ?? 0;
  return {
    id: newId("ov"),
    label,
    sort_order: index,
  };
}

export function combinationKey(optionValueIds: string[]): string {
  return [...optionValueIds].sort().join("-");
}

export function estimateCombinationCount(groups: ProductOptionGroup[]): number {
  const nonempty = groups.filter((g) => g.values.some((v) => v.label.trim()));
  if (!nonempty.length) return 0;
  return nonempty.reduce((acc, g) => {
    const n = g.values.filter((v) => v.label.trim()).length;
    return acc * Math.max(1, n);
  }, 1);
}

export function countCombinations(groups: ProductOptionGroup[]): number {
  return estimateCombinationCount(groups);
}

export function generateSequentialSkus(prefix: string, count: number): string[] {
  const clean =
    prefix.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase() || "SKU";
  return Array.from({ length: count }, (_, i) =>
    `${clean}-${String(i + 1).padStart(3, "0")}`
  );
}

type Combo = {
  option_values: Record<string, string>;
  labels: string[];
  valueIds: string[];
};

function cartesian(groups: ProductOptionGroup[]): Combo[] {
  const active = groups
    .filter((g) => g.values.some((v) => v.label.trim()))
    .map((g) => ({
      ...g,
      values: g.values.filter((v) => v.label.trim()),
    }));
  if (!active.length) return [];

  let combos: Combo[] = [{ option_values: {}, labels: [], valueIds: [] }];
  for (const group of active) {
    const next: Combo[] = [];
    for (const base of combos) {
      for (const val of group.values) {
        next.push({
          option_values: { ...base.option_values, [group.id]: val.id },
          labels: [...base.labels, val.label.trim()],
          valueIds: [...base.valueIds, val.id],
        });
      }
    }
    combos = next;
  }
  return combos;
}

export function rebuildVariantsFromGroups(
  groups: ProductOptionGroup[],
  existing: ProductVariantRow[],
  defaults?: {
    price?: string;
    sale_price?: string;
    cost_price?: string;
    stock?: string;
    weight_grams?: string;
    skuPrefix?: string;
  }
): { variants: ProductVariantRow[]; truncated: boolean; estimated: number } {
  const estimated = estimateCombinationCount(groups);
  if (estimated > MAX_VARIANTS) {
    return { variants: existing, truncated: true, estimated };
  }

  const byKey = new Map(
    existing.map((v) => [v.combination_key || combinationKey(Object.values(v.option_values)), v])
  );

  const combos = cartesian(groups);
  const firstGroupName = groups.find((g) => g.name.trim())?.name.trim() || "規格";
  const prefix = (defaults?.skuPrefix || "SKU").replace(/[^A-Za-z0-9_-]/g, "").toUpperCase() || "SKU";

  const variants: ProductVariantRow[] = combos.map((combo, index) => {
    const key = combinationKey(combo.valueIds);
    const prev = byKey.get(key);
    const label = combo.labels.join(" × ");
    if (prev) {
      return {
        ...prev,
        combination_key: key,
        option_values: combo.option_values,
        name: firstGroupName,
        value: label,
        sort_order: index,
      };
    }
    return {
      id: newId("pv"),
      combination_key: key,
      option_values: combo.option_values,
      name: firstGroupName,
      value: label,
      sku: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      barcode: "",
      price: defaults?.price ?? "",
      sale_price: defaults?.sale_price ?? defaults?.price ?? "",
      cost_price: defaults?.cost_price ?? "",
      price_adjustment: "0",
      stock: defaults?.stock ?? "",
      weight_grams: defaults?.weight_grams ?? "",
      image_url: "",
      is_active: true,
      is_default: index === 0,
      sort_order: index,
    };
  });

  return { variants, truncated: false, estimated };
}

export function autoGenerateSkus(
  variants: ProductVariantRow[],
  skuPrefix: string
): ProductVariantRow[] {
  const prefix =
    skuPrefix.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase() || "SKU";
  return variants.map((v, i) => ({
    ...v,
    sku: `${prefix}-${String(i + 1).padStart(3, "0")}`,
  }));
}

export function findDuplicateSkus(variants: ProductVariantRow[]): string[] {
  const seen = new Map<string, number>();
  const dups = new Set<string>();
  for (const v of variants) {
    const sku = v.sku.trim().toUpperCase();
    if (!sku) continue;
    const n = (seen.get(sku) ?? 0) + 1;
    seen.set(sku, n);
    if (n > 1) dups.add(sku);
  }
  return Array.from(dups);
}

/** Infer option groups from legacy flat variants (name/value only). */
export function inferGroupsFromLegacyVariants(
  variants: Array<{ id: string; name: string; value: string; sort_order?: number }>
): ProductOptionGroup[] {
  if (!variants.length) return [];
  const byName = new Map<string, ProductOptionValue[]>();
  for (const v of variants) {
    const name = v.name.trim() || "規格";
    const label = v.value.trim();
    if (!label) continue;
    const list = byName.get(name) ?? [];
    if (!list.some((x) => x.label === label)) {
      list.push({ id: newId("ov"), label, sort_order: list.length });
    }
    byName.set(name, list);
  }
  return Array.from(byName.entries()).map(([name, values], i) => ({
    id: newId("og"),
    name,
    sort_order: i,
    values,
  }));
}

export function normalizeIncomingVariant(raw: Record<string, unknown>, index: number): ProductVariantRow {
  const option_values =
    raw.option_values && typeof raw.option_values === "object"
      ? (raw.option_values as Record<string, string>)
      : {};
  const valueIds = Object.values(option_values);
  return {
    id: String(raw.id ?? newId("pv")),
    combination_key:
      typeof raw.combination_key === "string" && raw.combination_key
        ? raw.combination_key
        : valueIds.length
          ? combinationKey(valueIds)
          : combinationKey([String(raw.id ?? index)]),
    option_values,
    name: String(raw.name ?? "規格"),
    value: String(raw.value ?? ""),
    sku: String(raw.sku ?? ""),
    barcode: String(raw.barcode ?? ""),
    price: raw.price != null && raw.price !== "" ? String(raw.price) : "",
    sale_price:
      raw.sale_price != null && raw.sale_price !== ""
        ? String(raw.sale_price)
        : "",
    cost_price:
      raw.cost_price != null && raw.cost_price !== ""
        ? String(raw.cost_price)
        : "",
    price_adjustment: String(raw.price_adjustment ?? "0"),
    stock: raw.stock != null && raw.stock !== "" ? String(raw.stock) : "",
    weight_grams:
      raw.weight_grams != null && raw.weight_grams !== ""
        ? String(raw.weight_grams)
        : "",
    image_url: String(raw.image_url ?? ""),
    is_active: raw.is_active !== false,
    is_default: Boolean(raw.is_default),
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : index,
  };
}
