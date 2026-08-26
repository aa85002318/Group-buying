import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeProductPatch,
  hasEnabledPatch,
  type ProductBatchPatch,
  type ProductBatchRow,
  type StyleConfig,
} from "@/lib/admin/product-batch";

const shipKey = z.enum([
  "temp_ambient",
  "temp_chilled",
  "temp_frozen",
  "ship_home",
  "ship_cvs",
  "ship_store_pickup",
]);

export const productBatchPatchSchema = z.object({
  status: z.object({
    enabled: z.boolean(),
    value: z.enum(["draft", "active", "inactive", "sold_out", "scheduled_publish", "scheduled_unpublish"]),
  }).optional(),
  name: z.object({
    enabled: z.boolean(),
    op: z.enum(["replace", "prefix", "suffix", "search_replace"]),
    value: z.string(),
    find: z.string().optional(),
  }).optional(),
  subtitle: z.object({
    enabled: z.boolean(),
    op: z.enum(["replace", "prefix", "suffix", "search_replace", "clear"]),
    value: z.string(),
    find: z.string().optional(),
  }).optional(),
  sku: z.object({
    enabled: z.boolean(),
    op: z.enum(["prefix", "suffix", "search_replace", "regenerate"]),
    value: z.string(),
    find: z.string().optional(),
  }).optional(),
  categories: z.object({
    enabled: z.boolean(),
    mode: z.enum(["replace", "add", "remove"]),
    categoryIds: z.array(z.string().uuid()),
  }).optional(),
  shipping: z.object({
    enabled: z.boolean(),
    mode: z.enum(["replace", "add", "remove"]),
    keys: z.array(shipKey),
  }).optional(),
  price: z.object({
    enabled: z.boolean(),
    mode: z.enum(["set", "add_amount", "sub_amount", "add_percent", "sub_percent"]),
    value: z.number(),
    round: z.boolean().optional(),
    includeCost: z.boolean().optional(),
    costValue: z.number().optional(),
  }).optional(),
  info: z.object({
    enabled: z.boolean(),
    mode: z.enum(["prefix", "suffix", "search_replace", "clear_paragraph", "apply_style", "overwrite"]),
    value: z.string().optional().default(""),
    find: z.string().optional(),
    templateKey: z.string().optional(),
  }).optional(),
  content: z
    .object({
      enabled: z.boolean(),
      rich_description: z
        .object({ enabled: z.boolean(), html: z.string() })
        .optional(),
      product_info: z.object({ enabled: z.boolean(), html: z.string() }).optional(),
      specifications: z.object({ enabled: z.boolean(), html: z.string() }).optional(),
    })
    .optional(),
});

export const productBatchBodySchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
  patch: productBatchPatchSchema,
  runMode: z.enum(["all_or_nothing", "skip_errors"]).optional(),
});

async function loadTemplates(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin
    .from("product_description_templates")
    .select("template_key, style_config")
    .eq("is_active", true);
  const map: Record<string, StyleConfig> = {};
  for (const row of data ?? []) {
    map[String(row.template_key)] = (row.style_config ?? {}) as StyleConfig;
  }
  return map;
}

async function loadProducts(admin: ReturnType<typeof createAdminClient>, ids: string[]) {
  const { data, error } = await admin.from("products").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  const { data: links } = await admin
    .from("product_category_links")
    .select("product_id, category_id")
    .in("product_id", ids);
  const byProduct = new Map<string, string[]>();
  for (const row of links ?? []) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row.category_id);
    byProduct.set(row.product_id, list);
  }
  const ordered = ids
    .map((id) => (data ?? []).find((p) => p.id === id))
    .filter(Boolean) as ProductBatchRow[];
  return ordered.map((p) => ({
    ...p,
    category_ids: byProduct.get(p.id) ?? (p.category_id ? [p.category_id] : []),
  }));
}

export async function previewBatch(productIds: string[], patch: ProductBatchPatch) {
  if (!isSupabaseConfigured()) {
    throw new Error("未設定資料庫");
  }
  if (!hasEnabledPatch(patch)) {
    throw new Error("請至少啟用一個修改欄位");
  }
  const admin = createAdminClient();
  const [products, templates] = await Promise.all([
    loadProducts(admin, productIds),
    loadTemplates(admin),
  ]);
  const missing = productIds.filter((id) => !products.some((p) => p.id === id));
  const items = products.map((product, index) => {
    const result = computeProductPatch(product, patch, { index, templates });
    return {
      productId: product.id,
      name: product.name,
      sku: product.sku ?? null,
      ok: result.errors.length === 0,
      errors: result.errors,
      before: {
        name: product.name,
        subtitle: product.subtitle ?? null,
        sku: product.sku ?? null,
        status: product.status,
        price: product.price,
        category_ids: product.category_ids,
        rich_description: product.rich_description ?? product.description ?? null,
        product_info: product.product_info ?? null,
        specifications: product.specifications ?? null,
      },
      after: result.after,
      db: result.db,
      categoryIds: result.categoryIds,
    };
  });

  if (patch.sku?.enabled) {
    const proposed = items.map((i) => String(i.after.sku ?? ""));
    const dupInside = proposed.filter((sku, i) => sku && proposed.indexOf(sku) !== i);
    const { data: existing } = await admin
      .from("products")
      .select("id, sku, name")
      .in("sku", proposed.filter(Boolean));
    for (const item of items) {
      const sku = String(item.after.sku ?? "");
      if (dupInside.includes(sku)) {
        item.ok = false;
        item.errors.push(`選取商品之間 SKU 重複：${sku}`);
      }
      const clash = (existing ?? []).find((row) => row.sku === sku && row.id !== item.productId);
      if (clash) {
        item.ok = false;
        item.errors.push(`SKU 與其他商品重複：${clash.name}`);
      }
    }
  }

  for (const id of missing) {
    items.push({
      productId: id,
      name: "（找不到商品）",
      sku: null,
      ok: false,
      errors: ["商品不存在"],
      before: {
        name: "",
        subtitle: null,
        sku: null,
        status: null,
        price: 0,
        category_ids: [],
        rich_description: null,
        product_info: null,
        specifications: null,
      },
      after: {
        name: "",
        subtitle: null,
        sku: null,
        status: null,
        price: 0,
        category_ids: [],
        rich_description: null,
        product_info: null,
        specifications: null,
      },
      db: {},
      categoryIds: undefined,
    });
  }

  const executable = items.filter((i) => i.ok);
  return {
    total: items.length,
    executableCount: executable.length,
    errorCount: items.length - executable.length,
    items,
  };
}
