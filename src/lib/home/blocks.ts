import type { HomepageBlock } from "@/lib/types/database";
import {
  HOME_SECTION_SORT_DEFAULT,
  isHomeSectionKey,
  type HomeSectionKey,
} from "@/lib/home/section-keys";

export type HomeBlockKey = HomeSectionKey;

const DEFAULTS: Record<
  HomeSectionKey,
  { title: string; displayCount: number; visible: boolean }
> = {
  hero: { title: "Hero Banner", displayCount: 5, visible: true },
  hot_searches: { title: "熱門搜尋", displayCount: 10, visible: true },
  latest_recipes: { title: "本週熱門食譜", displayCount: 4, visible: true },
  recipe_kits: { title: "一鍵購買材料", displayCount: 4, visible: true },
  popular_categories: { title: "找材料", displayCount: 8, visible: true },
  popular_baking_products: { title: "本週熱賣商品", displayCount: 8, visible: true },
  featured_courses: { title: "最新課程", displayCount: 4, visible: true },
  closing_group_buys: { title: "團購優惠", displayCount: 4, visible: true },
  latest_videos: { title: "最新影音", displayCount: 4, visible: true },
  trust_services: { title: "安心服務", displayCount: 4, visible: true },
  brand_statement: { title: "品牌定位", displayCount: 4, visible: false },
  quick_menu: { title: "快捷入口", displayCount: 8, visible: false },
  ai_assistant: { title: "AI 烘焙助手", displayCount: 4, visible: false },
  baking_inspiration: { title: "今日烘焙靈感", displayCount: 4, visible: false },
  weekly_new_products: { title: "本週新品推薦", displayCount: 8, visible: false },
  chime_select: { title: "CHIME 精選", displayCount: 8, visible: false },
  weekly_live_streams: { title: "本週團購直播", displayCount: 4, visible: false },
  weekly_promotions: { title: "本週優惠", displayCount: 4, visible: false },
  monthly_challenge: { title: "本月烘焙挑戰", displayCount: 3, visible: false },
  seasonal_themes: { title: "季節主題企劃", displayCount: 4, visible: false },
  store_information: { title: "門市資訊", displayCount: 1, visible: false },
  latest_articles: { title: "最新資訊", displayCount: 5, visible: false },
};

export type ResolvedHomeBlock = {
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
  raw: HomepageBlock | null;
};

export function resolveHomeBlock(
  blocks: HomepageBlock[] | null | undefined,
  key: HomeSectionKey
): ResolvedHomeBlock {
  const fallback = DEFAULTS[key];
  const found = blocks?.find((b) => b.block_key === key);
  if (!found) {
    return {
      key,
      visible: fallback.visible,
      title: fallback.title,
      subtitle: null,
      displayCount: fallback.displayCount,
      sortOrder: HOME_SECTION_SORT_DEFAULT[key],
      sourceMode: "auto",
      dataSource: null,
      viewAllUrl: null,
      manualIds: [],
      config: null,
      raw: null,
    };
  }
  return {
    key,
    visible: found.is_visible !== false,
    title: found.title || fallback.title,
    subtitle: found.subtitle ?? null,
    displayCount: Math.max(
      1,
      Number(found.display_count ?? fallback.displayCount) || fallback.displayCount
    ),
    sortOrder: Number(found.sort_order ?? HOME_SECTION_SORT_DEFAULT[key]),
    sourceMode: found.source_mode === "manual" ? "manual" : "auto",
    dataSource: found.data_source ?? null,
    viewAllUrl: found.view_all_url ?? null,
    manualIds: Array.isArray(found.manual_ids) ? found.manual_ids : [],
    config: (found.config as Record<string, unknown> | null) ?? null,
    raw: found,
  };
}

/** Visible CMS sections ordered by sort_order (unknown keys skipped). */
export function listOrderedHomeSections(
  blocks: HomepageBlock[] | null | undefined
): ResolvedHomeBlock[] {
  const known = (blocks ?? []).filter((b) => isHomeSectionKey(b.block_key));
  const keys = known.length
    ? known
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((b) => b.block_key as HomeSectionKey)
    : (Object.keys(HOME_SECTION_SORT_DEFAULT) as HomeSectionKey[]).sort(
        (a, b) => HOME_SECTION_SORT_DEFAULT[a] - HOME_SECTION_SORT_DEFAULT[b]
      );

  const resolved = keys.map((key) => resolveHomeBlock(blocks, key));
  return resolved.filter((b) => b.visible);
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
