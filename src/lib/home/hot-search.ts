/** Default / CMS-driven hot search keywords for the home chips. */

export type HotSearchLinkType =
  | "recipe_search"
  | "product_search"
  | "product_category"
  | "course"
  | "custom";

export type HotSearchKeyword = {
  id: string;
  label: string;
  keyword?: string;
  linkType?: HotSearchLinkType;
  linkTarget?: string;
  enabled?: boolean;
  sortOrder?: number;
};

export const DEFAULT_HOT_SEARCH_KEYWORDS: HotSearchKeyword[] = [
  { id: "scone", label: "司康", keyword: "司康", linkType: "recipe_search", sortOrder: 10 },
  { id: "croissant", label: "可頌", keyword: "可頌", linkType: "recipe_search", sortOrder: 20 },
  { id: "roll", label: "生乳捲", keyword: "生乳捲", linkType: "recipe_search", sortOrder: 30 },
  { id: "cookie", label: "巧克力餅乾", keyword: "巧克力餅乾", linkType: "recipe_search", sortOrder: 40 },
  { id: "toast", label: "吐司", keyword: "吐司", linkType: "recipe_search", sortOrder: 50 },
  { id: "bagel", label: "貝果", keyword: "貝果", linkType: "recipe_search", sortOrder: 60 },
];

function asLinkType(value: unknown): HotSearchLinkType {
  const v = String(value ?? "");
  if (
    v === "recipe_search" ||
    v === "product_search" ||
    v === "product_category" ||
    v === "course" ||
    v === "custom"
  ) {
    return v;
  }
  return "product_search";
}

/** Parse keywords from homepage_blocks.config.keywords (Admin CMS). */
export function parseHotSearchKeywords(
  config: Record<string, unknown> | null | undefined
): HotSearchKeyword[] {
  const raw = config?.keywords;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const parsed: HotSearchKeyword[] = [];
  raw.forEach((item, index) => {
    if (typeof item === "string" && item.trim()) {
      const label = item.trim().replace(/^#/, "");
      parsed.push({
        id: `kw-${index}`,
        label,
        keyword: label,
        linkType: "product_search",
        enabled: true,
        sortOrder: index * 10,
      });
      return;
    }
    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? row.keyword ?? "").trim().replace(/^#/, "");
      if (!label) return;
      if (row.enabled === false || row.is_active === false) return;
      const keyword = String(row.keyword ?? label).trim() || label;
      parsed.push({
        id: String(row.id ?? `kw-${index}`),
        label,
        keyword,
        linkType: asLinkType(row.linkType ?? row.link_type),
        linkTarget: row.linkTarget
          ? String(row.linkTarget)
          : row.link_target
            ? String(row.link_target)
            : undefined,
        enabled: true,
        sortOrder: Number(row.sort_order ?? row.sortOrder ?? index * 10) || index * 10,
      });
    }
  });

  return parsed.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function resolveHotSearchKeywords(
  config: Record<string, unknown> | null | undefined,
  fallback: HotSearchKeyword[] = DEFAULT_HOT_SEARCH_KEYWORDS
): HotSearchKeyword[] {
  const fromCms = parseHotSearchKeywords(config);
  return fromCms.length > 0 ? fromCms : fallback;
}

export function hotSearchHref(item: HotSearchKeyword | string): string {
  if (typeof item === "string") {
    return `/search?q=${encodeURIComponent(item)}`;
  }
  const q = encodeURIComponent(item.keyword || item.label);
  switch (item.linkType) {
    case "recipe_search":
      return `/recipes?q=${q}`;
    case "product_category":
      return item.linkTarget?.startsWith("/")
        ? item.linkTarget
        : `/baking-materials/${item.linkTarget || q}`;
    case "course":
      return item.linkTarget?.startsWith("/")
        ? item.linkTarget
        : `/courses${item.linkTarget ? `/${item.linkTarget}` : ""}`;
    case "custom":
      return item.linkTarget && item.linkTarget.startsWith("/")
        ? item.linkTarget
        : `/search?q=${q}`;
    case "product_search":
    default:
      return `/search?q=${q}`;
  }
}
