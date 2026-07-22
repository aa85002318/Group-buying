import type { HomepageBlock } from "@/lib/types/database";

export type HomeBlockKey =
  | "hero_banner"
  | "primary_services"
  | "quick_menu"
  | "popular_categories"
  | "new_products"
  | "hot_products"
  | "recipes"
  | "videos"
  | "group_buy_closing"
  | "weekly_promo"
  | "news"
  | "member_benefits"
  | "ai_tools"
  | "store_info"
  | "hot_search"
  | "quick_reorder"
  | "recent_browse";

const DEFAULTS: Record<
  HomeBlockKey,
  { title: string; displayCount: number; visible: boolean }
> = {
  hero_banner: { title: "Hero Banner", displayCount: 1, visible: true },
  primary_services: { title: "四大快捷入口", displayCount: 4, visible: true },
  quick_menu: { title: "快捷入口", displayCount: 8, visible: true },
  popular_categories: { title: "熱門分類", displayCount: 8, visible: true },
  new_products: { title: "今日新品", displayCount: 8, visible: true },
  hot_products: { title: "熱門商品", displayCount: 8, visible: true },
  recipes: { title: "最新食譜", displayCount: 4, visible: true },
  videos: { title: "影音", displayCount: 4, visible: true },
  group_buy_closing: { title: "即將收單團購", displayCount: 4, visible: true },
  weekly_promo: { title: "本週優惠", displayCount: 4, visible: true },
  news: { title: "最新資訊", displayCount: 3, visible: true },
  member_benefits: { title: "會員福利", displayCount: 1, visible: true },
  ai_tools: { title: "AI 烘焙助手", displayCount: 2, visible: true },
  store_info: { title: "門市服務", displayCount: 1, visible: true },
  hot_search: { title: "熱門搜尋", displayCount: 10, visible: true },
  quick_reorder: { title: "再次購買", displayCount: 6, visible: true },
  recent_browse: { title: "最近瀏覽", displayCount: 5, visible: true },
};

export function resolveHomeBlock(
  blocks: HomepageBlock[] | null | undefined,
  key: HomeBlockKey
): {
  visible: boolean;
  title: string;
  subtitle: string | null;
  displayCount: number;
  config: Record<string, unknown> | null;
} {
  const fallback = DEFAULTS[key];
  const found = blocks?.find((b) => b.block_key === key);
  if (!found) {
    return {
      visible: fallback.visible,
      title: fallback.title,
      subtitle: null,
      displayCount: fallback.displayCount,
      config: null,
    };
  }
  return {
    visible: found.is_visible !== false,
    title: found.title || fallback.title,
    subtitle: found.subtitle ?? null,
    displayCount: Math.max(1, Number(found.display_count ?? fallback.displayCount) || fallback.displayCount),
    config: (found.config as Record<string, unknown> | null) ?? null,
  };
}
