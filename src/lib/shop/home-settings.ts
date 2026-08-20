/** Shop hub home CMS — version C quick-entry storefront + leftover welcome fields. */

export const SHOP_WELCOME_YELLOW = "#FFD454";

export type ShopMascotSize = "S" | "M" | "L";
export type ShopMascotPosition = "left" | "center" | "right";

export type ShopDecorationSlot = {
  url: string | null;
  path: string | null;
  enabled: boolean;
  /** Width in px (18–48). */
  size: number;
  /** Percent from left (0–100). */
  x: number;
  /** Percent from top (0–100). */
  y: number;
};

export type ShopProductBlockId = "new" | "popular" | "sale" | "bundle" | "featured";

export type ShopProductBlockSettings = {
  visible: boolean;
  title: string;
  limit: number;
  sort: "hot" | "new" | "featured" | "sale" | "bundle";
};

export type ShopHomeSettings = {
  show_welcome_section: boolean;
  shop_title: string;
  welcome_eyebrow: string;
  welcome_title: string;
  welcome_subtitle: string;
  welcome_background_color: string;
  mascot_image_url: string | null;
  mascot_image_path: string | null;
  mascot_alt: string;
  mascot_width: number | null;
  mascot_height: number | null;
  mascot_file_size: number | null;
  mascot_size: ShopMascotSize;
  mascot_position: ShopMascotPosition;
  search_placeholder: string;
  show_popular_keywords: boolean;
  decorations: [ShopDecorationSlot, ShopDecorationSlot, ShopDecorationSlot];
  product_blocks: Record<ShopProductBlockId, ShopProductBlockSettings>;
};

export type ShopPopularKeyword = {
  id: string;
  keyword: string;
  url: string;
  sort_order: number;
  is_active: boolean;
};

export const DEFAULT_DECORATION: ShopDecorationSlot = {
  url: null,
  path: null,
  enabled: false,
  size: 28,
  x: 8,
  y: 12,
};

export const DEFAULT_SHOP_PRODUCT_BLOCKS: Record<ShopProductBlockId, ShopProductBlockSettings> = {
  new: { visible: true, title: "本週上新", limit: 10, sort: "new" },
  popular: { visible: true, title: "熱門商品", limit: 10, sort: "hot" },
  sale: { visible: true, title: "優惠商品", limit: 10, sort: "sale" },
  bundle: { visible: true, title: "組合優惠", limit: 10, sort: "bundle" },
  featured: { visible: false, title: "精選商品", limit: 8, sort: "featured" },
};

export const DEFAULT_SHOP_HOME_SETTINGS: ShopHomeSettings = {
  show_welcome_section: false,
  shop_title: "商城",
  welcome_eyebrow: "歡迎來到",
  welcome_title: "CHIMEiDIY",
  welcome_subtitle: "烘焙材料這裡都有！\n一起享受烘焙的快樂時光 ✨",
  welcome_background_color: SHOP_WELCOME_YELLOW,
  mascot_image_url: null,
  mascot_image_path: null,
  mascot_alt: "CHIMEiDIY IP",
  mascot_width: null,
  mascot_height: null,
  mascot_file_size: null,
  mascot_size: "M",
  mascot_position: "left",
  search_placeholder: "搜尋商品、食譜、烘焙材料…",
  show_popular_keywords: true,
  decorations: [
    { ...DEFAULT_DECORATION, x: 6, y: 10 },
    { ...DEFAULT_DECORATION, x: 88, y: 8, size: 22 },
    { ...DEFAULT_DECORATION, x: 78, y: 62, size: 24 },
  ],
  product_blocks: { ...DEFAULT_SHOP_PRODUCT_BLOCKS },
};

export const DEFAULT_SHOP_POPULAR_KEYWORDS: ShopPopularKeyword[] = [
  { id: "kw-1", keyword: "低筋麵粉", url: "/shop/search?q=低筋麵粉", sort_order: 10, is_active: true },
  { id: "kw-2", keyword: "鮮奶油", url: "/shop/search?q=鮮奶油", sort_order: 20, is_active: true },
  { id: "kw-3", keyword: "巧克力", url: "/shop/search?q=巧克力", sort_order: 30, is_active: true },
  { id: "kw-4", keyword: "奶油", url: "/shop/search?q=奶油", sort_order: 40, is_active: true },
  { id: "kw-5", keyword: "蛋糕模", url: "/shop/search?q=蛋糕模", sort_order: 50, is_active: true },
];

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizeWelcomeHex(value: unknown, fallback = SHOP_WELCOME_YELLOW): string {
  const v = String(value ?? "").trim().toUpperCase();
  return HEX_RE.test(v) ? v : fallback.toUpperCase();
}

function asText(value: unknown, fallback: string): string {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function asNullableText(value: unknown): string | null {
  const v = String(value ?? "").trim();
  return v || null;
}

function asInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseSize(value: unknown): ShopMascotSize {
  const v = String(value ?? "").toUpperCase();
  if (v === "S" || v === "M" || v === "L") return v;
  return "M";
}

function parsePosition(value: unknown): ShopMascotPosition {
  const v = String(value ?? "").toLowerCase();
  if (v === "left" || v === "center" || v === "right") return v;
  return "left";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseDecoration(raw: unknown, fallback: ShopDecorationSlot, urlCol?: unknown): ShopDecorationSlot {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const url = asNullableText(row.url) ?? asNullableText(urlCol);
  return {
    url,
    path: asNullableText(row.path),
    enabled: row.enabled !== false && Boolean(url),
    size: clamp(asInt(row.size) ?? fallback.size, 16, 56),
    x: clamp(asInt(row.x) ?? fallback.x, 0, 100),
    y: clamp(asInt(row.y) ?? fallback.y, 0, 100),
  };
}

function parseProductBlocks(raw: unknown): Record<ShopProductBlockId, ShopProductBlockSettings> {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const one = (id: ShopProductBlockId): ShopProductBlockSettings => {
    const d = DEFAULT_SHOP_PRODUCT_BLOCKS[id];
    const row = src[id] && typeof src[id] === "object" ? (src[id] as Record<string, unknown>) : {};
    const sort =
      row.sort === "new" ||
      row.sort === "featured" ||
      row.sort === "hot" ||
      row.sort === "sale" ||
      row.sort === "bundle"
        ? row.sort
        : d.sort;
    let title = String(row.title ?? "").trim() || d.title;
    if (id === "new" && title === "新品上架") title = "本週上新";
    return {
      visible: row.visible !== undefined ? Boolean(row.visible) : d.visible,
      title,
      limit: Math.min(12, Math.max(4, Number(row.limit ?? d.limit) || d.limit)),
      sort,
    };
  };
  return {
    new: one("new"),
    popular: one("popular"),
    sale: one("sale"),
    bundle: one("bundle"),
    featured: one("featured"),
  };
}

export function parseShopHomeSettings(
  row: Record<string, unknown> | null | undefined
): ShopHomeSettings {
  if (!row) {
    return {
      ...DEFAULT_SHOP_HOME_SETTINGS,
      decorations: DEFAULT_SHOP_HOME_SETTINGS.decorations.map((d) => ({ ...d })) as ShopHomeSettings["decorations"],
      product_blocks: { ...DEFAULT_SHOP_PRODUCT_BLOCKS },
    };
  }

  const defaults = DEFAULT_SHOP_HOME_SETTINGS.decorations;
  const rawDeco = Array.isArray(row.decorations) ? row.decorations : [];

  const decorations: ShopHomeSettings["decorations"] = [
    parseDecoration(rawDeco[0], defaults[0], row.decoration_1_url),
    parseDecoration(rawDeco[1], defaults[1], row.decoration_2_url),
    parseDecoration(rawDeco[2], defaults[2], row.decoration_3_url),
  ];

  return {
    show_welcome_section: row.show_welcome_section === true,
    shop_title: asText(row.shop_title, DEFAULT_SHOP_HOME_SETTINGS.shop_title),
    welcome_eyebrow: asText(row.welcome_eyebrow, DEFAULT_SHOP_HOME_SETTINGS.welcome_eyebrow),
    welcome_title: asText(row.welcome_title, DEFAULT_SHOP_HOME_SETTINGS.welcome_title),
    welcome_subtitle: asText(row.welcome_subtitle, DEFAULT_SHOP_HOME_SETTINGS.welcome_subtitle),
    welcome_background_color: normalizeWelcomeHex(
      row.welcome_background_color,
      DEFAULT_SHOP_HOME_SETTINGS.welcome_background_color
    ),
    mascot_image_url: asNullableText(row.mascot_image_url),
    mascot_image_path: asNullableText(row.mascot_image_path),
    mascot_alt: asText(row.mascot_alt, DEFAULT_SHOP_HOME_SETTINGS.mascot_alt),
    mascot_width: asInt(row.mascot_width),
    mascot_height: asInt(row.mascot_height),
    mascot_file_size: asInt(row.mascot_file_size),
    mascot_size: parseSize(row.mascot_size),
    mascot_position: parsePosition(row.mascot_position),
    search_placeholder: asText(
      row.search_placeholder,
      DEFAULT_SHOP_HOME_SETTINGS.search_placeholder
    ),
    show_popular_keywords: row.show_popular_keywords !== false,
    decorations,
    product_blocks: parseProductBlocks(row.product_blocks),
  };
}

export function settingsToDbPayload(settings: ShopHomeSettings, updatedBy?: string | null) {
  return {
    singleton_key: "main",
    show_welcome_section: settings.show_welcome_section,
    shop_title: settings.shop_title,
    welcome_eyebrow: settings.welcome_eyebrow,
    welcome_title: settings.welcome_title,
    welcome_subtitle: settings.welcome_subtitle,
    welcome_background_color: normalizeWelcomeHex(settings.welcome_background_color),
    mascot_image_url: settings.mascot_image_url,
    mascot_image_path: settings.mascot_image_path,
    mascot_alt: settings.mascot_alt,
    mascot_width: settings.mascot_width,
    mascot_height: settings.mascot_height,
    mascot_file_size: settings.mascot_file_size,
    mascot_size: settings.mascot_size,
    mascot_position: settings.mascot_position,
    search_placeholder: settings.search_placeholder,
    show_popular_keywords: settings.show_popular_keywords,
    decoration_1_url: settings.decorations[0]?.url ?? null,
    decoration_2_url: settings.decorations[1]?.url ?? null,
    decoration_3_url: settings.decorations[2]?.url ?? null,
    decorations: settings.decorations,
    product_blocks: settings.product_blocks,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? null,
  };
}

export function parseShopPopularKeywords(rows: unknown): ShopPopularKeyword[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item, i) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const keyword = String(row.keyword ?? "").trim();
      if (!keyword) return null;
      const encoded = encodeURIComponent(keyword);
      return {
        id: String(row.id ?? `kw-${i}`),
        keyword,
        url: String(row.url ?? "").trim() || `/shop/search?q=${encoded}`,
        sort_order: Number(row.sort_order ?? (i + 1) * 10) || (i + 1) * 10,
        is_active: row.is_active !== false,
      } satisfies ShopPopularKeyword;
    })
    .filter((k): k is ShopPopularKeyword => Boolean(k))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function mascotHeightClass(size: ShopMascotSize): string {
  if (size === "S") return "h-[140px] w-auto max-w-full md:h-[150px]";
  if (size === "L") return "h-[180px] w-auto max-w-full md:h-[190px]";
  return "h-[160px] w-auto max-w-full md:h-[175px]";
}
