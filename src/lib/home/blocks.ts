import type { HomepageBlock } from "@/lib/types/database";
import {
  HOME_SECTION_SORT_DEFAULT,
  PRIMARY_HOME_SECTION_KEYS,
  isHomeSectionKey,
  type HomeSectionKey,
} from "@/lib/home/section-keys";
import { DEFAULT_SERVICE_SHORTCUTS } from "@/lib/home/service-shortcuts";
import { DEFAULT_STORE_NEWS_CARDS } from "@/lib/home/store-news";
import {
  DEFAULT_QUICK_SERVICES_SETTINGS,
} from "@/types/home-quick-service";

export type HomeBlockKey = HomeSectionKey;

export const SECTION_DEFAULTS: Record<
  HomeSectionKey,
  {
    title: string;
    displayCount: number;
    visible: boolean;
    sourceMode?: "auto" | "manual";
    dataSource?: string | null;
    viewAllUrl?: string | null;
    config?: Record<string, unknown>;
  }
> = {
  hero: { title: "Hero 搜尋區", displayCount: 5, visible: true, dataSource: "banners" },
  store_news: {
    title: "門市最新資訊",
    displayCount: 2,
    visible: true,
    viewAllUrl: "/member",
    config: { cards: DEFAULT_STORE_NEWS_CARDS },
  },
  hot_searches: {
    title: "熱門搜尋",
    displayCount: 10,
    visible: false,
    sourceMode: "manual",
  },
  quick_entry: {
    title: "常用服務",
    displayCount: 8,
    visible: true,
    config: { ...DEFAULT_QUICK_SERVICES_SETTINGS },
  },
  latest_recipes: {
    title: "熱門食譜",
    displayCount: 8,
    visible: true,
    viewAllUrl: "/recipes",
  },
  recipe_kits: {
    title: "一鍵買齊材料",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/recipes",
    config: { subtitle: "跟著食譜，一次買齊所有材料" },
  },
  ingredient_shop: {
    title: "一鍵買齊材料",
    displayCount: 12,
    visible: true,
    viewAllUrl: "/baking-materials",
    config: {
      enabled: true,
      subtitle: "完整食材一次購足，讓烘焙更輕鬆！",
      product_source: "automatic",
      category_slugs: ["flour", "dairy", "sugar", "butter"],
      category_labels: { flour: "烘焙粉類", butter: "油脂類" },
      sort_type: "hot",
      product_limit: 12,
      more_card_title: "更多商品",
      more_card_subtitle: "查看更多烘焙材料",
      more_card_link: "/baking-materials",
    },
  },
  popular_categories: {
    title: "找材料",
    displayCount: 8,
    visible: true,
    viewAllUrl: "/baking-materials",
  },
  ingredient_categories: {
    title: "找材料",
    displayCount: 10,
    visible: true,
    viewAllUrl: "/products",
    config: { view_all_label: "查看全部", view_all_href: "/products", desktop_cols: 10, mobile_cols: 5 },
  },
  popular_baking_products: {
    title: "本週熱門商品",
    displayCount: 8,
    visible: true,
    sourceMode: "manual",
    viewAllUrl: "/baking-materials",
    config: { product_scope: "baking" },
  },
  product_series: {
    title: "系列商品曝光",
    displayCount: 8,
    visible: false,
    sourceMode: "manual",
    viewAllUrl: "/baking-materials",
    config: { product_scope: "baking", badge: "hot" },
  },
  featured_courses: {
    title: "最新課程",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/courses",
  },
  closing_group_buys: {
    title: "團購優惠中",
    displayCount: 4,
    visible: true,
    viewAllUrl: "/group-buy",
    config: { show_countdown: true, show_progress: true },
  },
  latest_videos: {
    title: "最新影音",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/videos",
  },
  service_shortcuts: {
    title: "服務快捷入口",
    displayCount: 4,
    visible: true,
    config: { items: DEFAULT_SERVICE_SHORTCUTS },
  },
  trust_services: { title: "安心服務", displayCount: 4, visible: false },
  brand_statement: { title: "品牌定位", displayCount: 4, visible: false },
  quick_menu: { title: "快捷入口", displayCount: 8, visible: false },
  ai_assistant: { title: "AI 烘焙助手", displayCount: 4, visible: false },
  baking_inspiration: { title: "今日烘焙靈感", displayCount: 4, visible: false },
  weekly_new_products: {
    title: "本週新品推薦",
    displayCount: 8,
    visible: false,
    viewAllUrl: "/products?sort=newest",
    config: { new_days: 7, product_scope: "baking" },
  },
  chime_select: {
    title: "CHIME 精選",
    displayCount: 8,
    visible: false,
    viewAllUrl: "/shop?scope=chime_select",
    config: { product_scope: "chime_select" },
  },
  weekly_live_streams: {
    title: "本週團購直播",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/live",
  },
  weekly_promotions: {
    title: "本週優惠",
    displayCount: 4,
    visible: false,
    dataSource: "banners",
  },
  banner_strip: {
    title: "Banner 帶",
    displayCount: 4,
    visible: false,
    dataSource: "banners",
    config: { placement: "home_custom" },
  },
  monthly_challenge: {
    title: "本月烘焙挑戰",
    displayCount: 3,
    visible: false,
    viewAllUrl: "/challenges",
  },
  seasonal_themes: {
    title: "季節主題企劃",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/themes",
  },
  store_information: {
    title: "門市資訊",
    displayCount: 1,
    visible: false,
    viewAllUrl: "/stores",
  },
  latest_articles: {
    title: "最新資訊",
    displayCount: 5,
    visible: false,
    viewAllUrl: "/articles",
  },
};

export type ResolvedHomeBlock = {
  /** Row id when from CMS; synthetic key when fallback */
  id: string;
  key: HomeSectionKey;
  visible: boolean;
  title: string;
  subtitle: string | null;
  displayCount: number;
  sortOrder: number;
  sourceMode: "auto" | "manual";
  dataSource: string | null;
  viewAllUrl: string | null;
  manualIds: string[];
  config: Record<string, unknown> | null;
  instanceLabel: string | null;
  raw: HomepageBlock | null;
};

export function resolveHomeBlockRow(row: HomepageBlock): ResolvedHomeBlock | null {
  if (!isHomeSectionKey(row.block_key)) return null;
  const fallback = SECTION_DEFAULTS[row.block_key];
  return {
    id: row.id,
    key: row.block_key,
    visible: row.is_visible !== false,
    title: row.title || fallback.title,
    subtitle: row.subtitle ?? null,
    displayCount: Math.max(
      1,
      Number(row.display_count ?? fallback.displayCount) || fallback.displayCount
    ),
    sortOrder: Number(row.sort_order ?? HOME_SECTION_SORT_DEFAULT[row.block_key]),
    sourceMode: row.source_mode === "manual" ? "manual" : "auto",
    dataSource: row.data_source ?? fallback.dataSource ?? null,
    viewAllUrl: row.view_all_url ?? fallback.viewAllUrl ?? null,
    manualIds: Array.isArray(row.manual_ids) ? row.manual_ids : [],
    config: (row.config as Record<string, unknown> | null) ?? fallback.config ?? null,
    instanceLabel: row.instance_label ?? null,
    raw: row,
  };
}

/** Resolve first matching block_key (legacy helpers / cream defaults). */
export function resolveHomeBlock(
  blocks: HomepageBlock[] | null | undefined,
  key: HomeSectionKey
): ResolvedHomeBlock {
  const fallback = SECTION_DEFAULTS[key];
  const found = blocks?.find((b) => b.block_key === key);
  if (!found) {
    return {
      id: `fallback-${key}`,
      key,
      visible: fallback.visible,
      title: fallback.title,
      subtitle: null,
      displayCount: fallback.displayCount,
      sortOrder: HOME_SECTION_SORT_DEFAULT[key],
      sourceMode: fallback.sourceMode ?? "auto",
      dataSource: fallback.dataSource ?? null,
      viewAllUrl: fallback.viewAllUrl ?? null,
      manualIds: [],
      config: fallback.config ?? null,
      instanceLabel: null,
      raw: null,
    };
  }
  return resolveHomeBlockRow(found)!;
}

/**
 * Visible CMS sections ordered by sort_order.
 * Supports multiple instances of the same block_key (each row is one section).
 */
export function listOrderedHomeSections(
  blocks: HomepageBlock[] | null | undefined
): ResolvedHomeBlock[] {
  const rows = (blocks ?? [])
    .map(resolveHomeBlockRow)
    .filter((b): b is ResolvedHomeBlock => Boolean(b));

  if (rows.length === 0) {
    return PRIMARY_HOME_SECTION_KEYS.map((key) => resolveHomeBlock([], key)).filter(
      (b) => b.visible
    );
  }

  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((b) => b.visible);
}

export function warnUnknownHomeSection(key: string) {
  if (process.env.NODE_ENV !== "production" && !isHomeSectionKey(key)) {
    console.warn(`[home] Ignoring unknown section key: ${key}`);
  }
}

/** Respect config.show_desktop / show_mobile (default true). */
export function blockVisibleOnViewport(
  config: Record<string, unknown> | null | undefined,
  isMobile: boolean
): boolean {
  if (!config) return true;
  if (isMobile && config.show_mobile === false) return false;
  if (!isMobile && config.show_desktop === false) return false;
  return true;
}

/** Build a new draft block instance from a catalog type. */
export function createBlockInstance(
  key: HomeSectionKey,
  opts?: {
    sortOrder?: number;
    instanceLabel?: string | null;
    configOverrides?: Record<string, unknown>;
  }
): HomepageBlock {
  const def = SECTION_DEFAULTS[key];
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    block_key: key,
    title: def.title,
    subtitle: null,
    is_visible: true,
    sort_order: opts?.sortOrder ?? HOME_SECTION_SORT_DEFAULT[key],
    display_count: def.displayCount,
    source_mode: def.sourceMode ?? "auto",
    data_source: def.dataSource ?? null,
    view_all_url: def.viewAllUrl ?? null,
    manual_ids: [],
    config: { ...(def.config ?? {}), ...(opts?.configOverrides ?? {}) },
    instance_label: opts?.instanceLabel ?? null,
    updated_at: now,
  };
}
