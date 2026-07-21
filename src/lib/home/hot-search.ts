/** Default / CMS-driven hot search keywords for the home chips. */

export type HotSearchKeyword = {
  id: string;
  label: string;
  enabled?: boolean;
  sortOrder?: number;
};

export const DEFAULT_HOT_SEARCH_KEYWORDS: HotSearchKeyword[] = [
  { id: "flour", label: "麵粉", sortOrder: 10 },
  { id: "butter", label: "奶油", sortOrder: 20 },
  { id: "dubai", label: "杜拜巧克力", sortOrder: 30 },
  { id: "moon", label: "中秋禮盒", sortOrder: 40 },
  { id: "tart", label: "蛋塔", sortOrder: 50 },
  { id: "cream", label: "鮮奶油", sortOrder: 60 },
  { id: "mix", label: "預拌粉", sortOrder: 70 },
  { id: "croissant", label: "可頌", sortOrder: 80 },
  { id: "toast", label: "吐司", sortOrder: 90 },
  { id: "cookie", label: "餅乾", sortOrder: 100 },
];

/** Parse keywords from homepage_blocks.config.keywords (Admin CMS). */
export function parseHotSearchKeywords(
  config: Record<string, unknown> | null | undefined
): HotSearchKeyword[] {
  const raw = config?.keywords;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const parsed: HotSearchKeyword[] = [];
  raw.forEach((item, index) => {
    if (typeof item === "string" && item.trim()) {
      parsed.push({
        id: `kw-${index}`,
        label: item.trim().replace(/^#/, ""),
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
      parsed.push({
        id: String(row.id ?? `kw-${index}`),
        label,
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

export function hotSearchHref(label: string): string {
  return `/search?q=${encodeURIComponent(label)}`;
}
