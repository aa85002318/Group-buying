/**
 * Per-device layout settings for the homepage blocks.
 *
 * The CONTENT of a block is shared (title, images, picked products…); only the
 * layout is split per device, in homepage_blocks.config — no schema change:
 *
 *   config.desktop_visible / config.mobile_visible   boolean
 *   config.desktop_columns / config.mobile_columns   number | null
 *   config.desktop_spacing / config.mobile_spacing   HomeSpacing | "page"
 *
 * The page-wide default lives in site_settings[HOME_LAYOUT_SETTING_KEY].
 */

export type HomeDevice = "desktop" | "mobile";

export type HomeSpacing = "none" | "tight" | "normal" | "loose";

/** Per-block value: "page" = follow the page-wide setting. */
export type HomeBlockSpacing = HomeSpacing | "page";

export const HOME_SPACING_LABELS: Record<HomeSpacing, string> = {
  none: "不留白",
  tight: "緊湊",
  normal: "標準",
  loose: "寬鬆",
};

export const HOME_BLOCK_SPACING_OPTIONS: Array<{ value: HomeBlockSpacing; label: string }> = [
  { value: "page", label: "跟整頁一樣" },
  { value: "none", label: HOME_SPACING_LABELS.none },
  { value: "tight", label: HOME_SPACING_LABELS.tight },
  { value: "normal", label: HOME_SPACING_LABELS.normal },
  { value: "loose", label: HOME_SPACING_LABELS.loose },
];

export const HOME_LAYOUT_SETTING_KEY = "home_layout_settings";

export type HomeLayoutSettings = {
  spacing: Record<HomeDevice, HomeSpacing>;
};

export const DEFAULT_HOME_LAYOUT_SETTINGS: HomeLayoutSettings = {
  spacing: { desktop: "normal", mobile: "normal" },
};

function asSpacing(value: unknown, fallback: HomeSpacing): HomeSpacing {
  return value === "none" || value === "tight" || value === "normal" || value === "loose"
    ? value
    : fallback;
}

export function normalizeHomeLayoutSettings(raw: unknown): HomeLayoutSettings {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const spacing = row.spacing && typeof row.spacing === "object"
    ? (row.spacing as Record<string, unknown>)
    : {};
  return {
    spacing: {
      desktop: asSpacing(spacing.desktop, DEFAULT_HOME_LAYOUT_SETTINGS.spacing.desktop),
      mobile: asSpacing(spacing.mobile, DEFAULT_HOME_LAYOUT_SETTINGS.spacing.mobile),
    },
  };
}

/** Block spacing for one device, falling back to the page-wide setting. */
export function resolveBlockSpacing(
  config: Record<string, unknown> | null | undefined,
  device: HomeDevice,
  pageSpacing: HomeSpacing
): HomeSpacing {
  const raw = (config ?? {})[`${device}_spacing`];
  if (raw === "page" || raw == null) return pageSpacing;
  return asSpacing(raw, pageSpacing);
}

export function blockSpacingValue(
  config: Record<string, unknown> | null | undefined,
  device: HomeDevice
): HomeBlockSpacing {
  const raw = (config ?? {})[`${device}_spacing`];
  if (raw === "none" || raw === "tight" || raw === "normal" || raw === "loose") return raw;
  return "page";
}

/** Website band padding per spacing step (Tailwind-safe list). */
export const DESKTOP_SPACING_CLASS: Record<HomeSpacing, string> = {
  none: "py-0",
  tight: "py-4 md:py-6",
  normal: "py-6 md:py-9 lg:py-10",
  loose: "py-10 md:py-14 lg:py-16",
};

/** App (phone) section gap per spacing step. */
export const MOBILE_SPACING_CLASS: Record<HomeSpacing, string> = {
  none: "pb-0",
  tight: "pb-2",
  normal: "pb-5",
  loose: "pb-9",
};

/** Per-device visibility; defaults to the row's own is_visible. */
export function blockVisibleOn(
  row: { is_visible?: boolean | null; config?: Record<string, unknown> | null } | null | undefined,
  device: HomeDevice,
  fallbackVisible = true
): boolean {
  const config = (row?.config ?? {}) as Record<string, unknown>;
  const base = row ? row.is_visible !== false : fallbackVisible;
  const value = config[`${device}_visible`];
  return typeof value === "boolean" ? value : base;
}

/** Per-device cards per row (1–8); null = the section's own default. */
export function blockColumnsOn(
  config: Record<string, unknown> | null | undefined,
  device: HomeDevice
): number | null {
  const raw = Number((config ?? {})[`${device}_columns`]);
  if (!Number.isFinite(raw) || raw < 1) return null;
  return Math.min(8, Math.round(raw));
}

/* ------------------------------------------------------------------ */
/* 首頁「商品分類」區塊設定：顯示哪些分類、要不要顯示圖示              */
/* ------------------------------------------------------------------ */

export type HomeCategoryPick = { id: string; enabled: boolean; sortOrder: number };

export type HomeCategorySettings = {
  /** Empty = 自動顯示後台勾選「顯示在商城首頁」的分類。 */
  items: HomeCategoryPick[];
  showIcons: boolean;
  showAllTile: boolean;
  maxItems: number;
};

export const DEFAULT_HOME_CATEGORY_SETTINGS: HomeCategorySettings = {
  items: [],
  showIcons: true,
  showAllTile: true,
  maxItems: 8,
};

export function parseHomeCategorySettings(
  config: Record<string, unknown> | null | undefined
): HomeCategorySettings {
  const c = (config ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(c.category_items) ? c.category_items : [];
  const items: HomeCategoryPick[] = rawItems
    .map((raw, i) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      const id = String(row.id ?? "").trim();
      if (!id) return null;
      return {
        id,
        enabled: row.enabled !== false,
        sortOrder: Number(row.sortOrder ?? row.sort_order ?? (i + 1) * 10) || (i + 1) * 10,
      };
    })
    .filter((x): x is HomeCategoryPick => Boolean(x))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const max = Number(c.category_max);
  return {
    items,
    showIcons: c.show_icons !== false,
    showAllTile: c.show_all_tile !== false,
    maxItems: Number.isFinite(max) && max >= 1 ? Math.min(12, Math.round(max)) : 8,
  };
}
