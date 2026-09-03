/** Fields used for admin product text search (server + client). */
export const PRODUCT_SEARCH_FIELDS = [
  "name",
  "sku",
  "barcode",
  "subtitle",
  "short_name",
  "supplier_name",
  "slug",
] as const;

export type ProductSearchField = (typeof PRODUCT_SEARCH_FIELDS)[number];

/** Escape `%`, `_`, `\` for Postgres ILIKE patterns. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Split user query into tokens (whitespace-separated). */
export function tokenizeSearchQuery(query: string): string[] {
  return query.trim().split(/\s+/).filter(Boolean);
}

function fieldText(product: Record<string, unknown>, field: ProductSearchField): string {
  return String(product[field] ?? "");
}

function tagText(product: Record<string, unknown>): string {
  const tags = product.tags;
  if (!Array.isArray(tags)) return "";
  return tags.map((t) => String(t ?? "")).join(" ");
}

/** Client-side match: every token must appear in at least one searchable field. */
export function matchesProductSearch(product: Record<string, unknown>, query: string): boolean {
  const tokens = tokenizeSearchQuery(query);
  if (!tokens.length) return true;

  const parts = [
    ...PRODUCT_SEARCH_FIELDS.map((f) => fieldText(product, f)),
    tagText(product),
  ]
    .join("\n")
    .toLowerCase();

  return tokens.every((token) => parts.includes(token.toLowerCase()));
}

/**
 * Supabase `.or()` filter for a single search string across product text fields.
 * Returns null when query is empty.
 */
export function buildProductSearchOrFilter(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const escaped = escapeIlikePattern(trimmed);
  return PRODUCT_SEARCH_FIELDS.map((field) => `${field}.ilike.%${escaped}%`).join(",");
}
