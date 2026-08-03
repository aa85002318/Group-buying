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
import {
  DEFAULT_GROUP_BUY_BANNER_SETTINGS,
} from "@/types/home-group-buy-banner";
import {
  DEFAULT_LATEST_CAMPAIGN_SETTINGS,
} from "@/types/home-latest-campaign";

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
  hero: { title: "主視覺 Banner", displayCount: 5, visible: true, dataSource: "brand_heroes" },
  latest_campaigns: {
    title: "最新活動",
    displayCount: 6,
    visible: true,
    viewAllUrl: "/group-buy",
    config: { ...DEFAULT_LATEST_CAMPAIGN_SETTINGS },
  },
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
    title: "精選食譜",
    displayCount: 8,
    visible: true,
    sourceMode: "auto",
    viewAllUrl: "/recipes",
  },
  recipe_kits: {
    title: "一鍵買齊材料（材料包）",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/recipes",
    config: { subtitle: "跟著食譜，一次買齊所有材料" },
  },
  ingredient_shop: {
    title: "一鍵買齊材料",
    displayCount: 12,
    visible: true,
    viewAllUrl: "/shop",
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
      more_card_link: "/shop",
      category_menu: [
        { id: "all", label: "全部", href: "/shop", enabled: true, sortOrder: 10 },
        { id: "flour", label: "麵粉", href: "/shop/category/flour", enabled: true, sortOrder: 20 },
        { id: "tools", label: "器具", href: "/shop/category/tools", enabled: true, sortOrder: 30 },
        { id: "packaging", label: "包裝", href: "/shop/category/packaging", enabled: true, sortOrder: 40 },
      ],
    },
  },
  group_buy_banner: {
    title: "團購輪播 Banner",
    displayCount: 5,
    visible: true,
    viewAllUrl: "/group-buy",
    config: { ...DEFAULT_GROUP_BUY_BANNER_SETTINGS },
  },
  weekly_group_buys: {
    title: "本週開團",
    displayCount: 12,
    visible: true,
    viewAllUrl: "/group-buy",
    config: {
      subtitle: "本週熱門開團，一起買更划算",
      source: "group_buy_events",
      manageHref: "/admin/group-buy-events",
    },
  },
  popular_categories: {
    title: "找材料",
    displayCount: 8,
    visible: false,
    viewAllUrl: "/shop",
  },
  ingredient_categories: {
    title: "找材料",
    displayCount: 10,
    visible: false,
    viewAllUrl: "/products",
    config: { view_all_label: "查看全部", view_all_href: "/products", desktop_cols: 10, mobile_cols: 5 },
  },
  popular_baking_products: {
    title: "本週熱門商品",
    displayCount: 8,
    visible: false,
    sourceMode: "manual",
    viewAllUrl: "/shop",
    config: { product_scope: "baking" },
  },
  product_series: {
    title: "系列商品曝光",
    displayCount: 8,
    visible: false,
    sourceMode: "manual",
    viewAllUrl: "/shop",
    config: { product_scope: "baking", badge: "hot" },
  },
  featured_courses: {
    title: "最新課程",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/courses",
  },
  closing_group_buys: {
    title: "即將結單",
    displayCount: 12,
    visible: true,
    viewAllUrl: "/group-buy",
    config: {
      subtitle: "倒數中的團購，把握最後機會",
      show_countdown: true,
      show_progress: true,
      source: "group_buy_events",
      manageHref: "/admin/group-buy-events",
    },
  },
  latest_videos: {
    title: "最新影音",
    displayCount: 4,
    visible: false,
    viewAllUrl: "/videos",
  },
  service_shortcuts: {
    title: "快捷服務入口",
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
    title: "CHIMEIDIY 團購精選",
    displayCount: 24,
    visible: true,
    viewAllUrl: "/group-buy",
    config: {
      subtitle: "精選團購好物，一起買更划算",
      source: "group_buy_events",
      category_menu: [
        { id: "all", label: "全部", href: "/group-buy", enabled: true, sortOrder: 10 },
        { id: "baking", label: "烘焙材料", href: "/group-buy?tag=baking", enabled: true, sortOrder: 20 },
        { id: "tools", label: "器具", href: "/group-buy?tag=tools", enabled: true, sortOrder: 30 },
        { id: "fresh", label: "生鮮", href: "/group-buy?tag=fresh", enabled: true, sortOrder: 40 },
      ],
    },
  },
  weekly_live_streams: {
    title: "LIVE 團購直播",
    displayCount: 8,
    visible: true,
    viewAllUrl: "/live",
    config: {
      subtitle: "鎖定直播檔期，不錯過限時優惠",
      source: "livestreams",
      manageHref: "/admin/livestreams",
    },
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
 * Visible homepage sections in canonical primary order.
 * Legacy / non-primary keys are ignored — new architecture only.
 * Missing primary keys fall back to SECTION_DEFAULTS so the live page stays complete.
 */
export function listOrderedHomeSections(
  blocks: HomepageBlock[] | null | undefined
): ResolvedHomeBlock[] {
  const byKey = new Map<HomeSectionKey, HomepageBlock>();
  for (const row of blocks ?? []) {
    if (!isHomeSectionKey(row.block_key)) continue;
    if (!PRIMARY_HOME_SECTION_KEYS.includes(row.block_key)) continue;
    if (!byKey.has(row.block_key)) byKey.set(row.block_key, row);
  }

  return PRIMARY_HOME_SECTION_KEYS.map((key) => {
    const row = byKey.get(key);
    if (row) {
      const resolved = resolveHomeBlockRow(row);
      if (!resolved || !resolved.visible) return null;
      return {
        ...resolved,
        sortOrder: HOME_SECTION_SORT_DEFAULT[key],
      };
    }
    const fallback = resolveHomeBlock([], key);
    return fallback.visible ? fallback : null;
  }).filter((b): b is ResolvedHomeBlock => Boolean(b));
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

/** Build the canonical primary homepage layout, preserving existing configs/ids. */
export function buildPrimaryHomeLayout(
  existing: HomepageBlock[] | null | undefined
): HomepageBlock[] {
  const byKey = new Map<string, HomepageBlock>();
  for (const row of existing ?? []) {
    if (!PRIMARY_HOME_SECTION_KEYS.includes(row.block_key as HomeSectionKey)) continue;
    if (!byKey.has(row.block_key)) byKey.set(row.block_key, row);
  }

  return PRIMARY_HOME_SECTION_KEYS.map((key) => {
    const found = byKey.get(key);
    if (found) {
      const def = SECTION_DEFAULTS[key];
      return {
        ...found,
        title: def.title,
        is_visible: true,
        sort_order: HOME_SECTION_SORT_DEFAULT[key],
        display_count: found.display_count ?? def.displayCount,
        source_mode: found.source_mode ?? def.sourceMode ?? "auto",
        data_source: found.data_source ?? def.dataSource ?? null,
        view_all_url: found.view_all_url ?? def.viewAllUrl ?? null,
        config:
          found.config && typeof found.config === "object" && Object.keys(found.config).length
            ? found.config
            : (def.config ?? {}),
        updated_at: new Date().toISOString(),
      } as HomepageBlock;
    }
    return createBlockInstance(key);
  });
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
