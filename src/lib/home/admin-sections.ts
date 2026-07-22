import type { HomepageBlock } from "@/lib/types/database";

/** Canonical homepage sections shown in the unified admin hub (front order). */
export type HomeAdminSectionId =
  | "hot_search"
  | "hero_banner"
  | "quick_menu"
  | "popular_categories"
  | "new_products"
  | "hot_products"
  | "group_buy_closing"
  | "weekly_promo"
  | "recipes"
  | "videos"
  | "news";

export type HomeAdminSectionMeta = {
  id: HomeAdminSectionId;
  blockKey: string;
  label: string;
  description: string;
  /** How content is chosen on the front */
  contentMode: "auto" | "manual" | "cms_items" | "banners" | "external";
  /** Deep-link to specialized editor when content lives elsewhere */
  manageHref?: string;
  manageLabel?: string;
  /** Show display_count field */
  hasDisplayCount?: boolean;
  /** Allow picking product IDs into manual_ids */
  hasProductPicker?: boolean;
  /** Keywords editor for hot search */
  hasKeywords?: boolean;
  /** Categories JSON editor */
  hasCategories?: boolean;
};

export const HOME_ADMIN_SECTIONS: HomeAdminSectionMeta[] = [
  {
    id: "hot_search",
    blockKey: "hot_search",
    label: "熱門搜尋",
    description: "設定關鍵字文字與顯示順序（上到下＝左到右）。",
    contentMode: "manual",
    hasKeywords: true,
    hasDisplayCount: true,
  },
  {
    id: "hero_banner",
    blockKey: "hero_banner",
    label: "Hero Banner",
    description: "首頁主視覺輪播。圖片建議 1400×700 px，圖上不放文字。",
    contentMode: "banners",
    manageHref: "/admin/banners?placement=home_hero",
    manageLabel: "管理 Hero Banner",
    hasDisplayCount: true,
  },
  {
    id: "quick_menu",
    blockKey: "quick_menu",
    label: "快捷入口",
    description: "橫向快捷圖示選單（圖示、標題、連結、排序）。",
    contentMode: "cms_items",
    manageHref: "/admin/home/quick-menu",
    manageLabel: "管理快捷入口",
  },
  {
    id: "popular_categories",
    blockKey: "popular_categories",
    label: "熱門分類",
    description: "圓形分類入口：名稱、連結、圖片與順序。",
    contentMode: "manual",
    hasCategories: true,
    hasDisplayCount: true,
  },
  {
    id: "new_products",
    blockKey: "new_products",
    label: "今日新品",
    description: "依商品上架時間自動排序，無需手動挑選。",
    contentMode: "auto",
    hasDisplayCount: true,
    manageHref: "/admin/products",
    manageLabel: "前往商品管理",
  },
  {
    id: "hot_products",
    blockKey: "hot_products",
    label: "熱門商品",
    description: "自行選取要出現在首頁的商品與順序。",
    contentMode: "manual",
    hasProductPicker: true,
    hasDisplayCount: true,
    manageHref: "/admin/products",
    manageLabel: "前往商品管理",
  },
  {
    id: "group_buy_closing",
    blockKey: "group_buy_closing",
    label: "即將收單團購",
    description: "顯示進行中的團購活動（自動抓取）。",
    contentMode: "auto",
    hasDisplayCount: true,
    manageHref: "/admin/group-buy",
    manageLabel: "管理團購活動",
  },
  {
    id: "weekly_promo",
    blockKey: "weekly_promo",
    label: "本週優惠",
    description: "橫向優惠 Banner（placement: home_weekly_promo）。",
    contentMode: "banners",
    manageHref: "/admin/banners?placement=home_weekly_promo",
    manageLabel: "管理本週優惠 Banner",
    hasDisplayCount: true,
  },
  {
    id: "recipes",
    blockKey: "recipes",
    label: "最新食譜",
    description: "依上傳／發布時間自動排序。",
    contentMode: "auto",
    hasDisplayCount: true,
    manageHref: "/admin/recipes",
    manageLabel: "管理食譜",
  },
  {
    id: "videos",
    blockKey: "videos",
    label: "影音",
    description: "依上傳時間自動排序。",
    contentMode: "auto",
    hasDisplayCount: true,
    manageHref: "/admin/videos",
    manageLabel: "管理影音",
  },
  {
    id: "news",
    blockKey: "news",
    label: "最新資訊",
    description: "連至文章管理：新增文章、置頂、調整排序。",
    contentMode: "external",
    hasDisplayCount: true,
    manageHref: "/admin/articles",
    manageLabel: "文章管理（置頂／順序／新增）",
  },
];

export function findBlock(
  blocks: HomepageBlock[],
  blockKey: string
): HomepageBlock | undefined {
  return blocks.find((b) => b.block_key === blockKey);
}

export type PopularCategoryConfig = {
  id: string;
  name: string;
  href: string;
  imageUrl?: string | null;
};

export function parsePopularCategories(
  config: Record<string, unknown> | null | undefined
): PopularCategoryConfig[] {
  const raw = config?.categories;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? "").trim();
      const href = String(row.href ?? "").trim();
      if (!name || !href) return null;
      return {
        id: String(row.id ?? `cat-${index}`),
        name,
        href,
        imageUrl: row.imageUrl ? String(row.imageUrl) : row.image_url ? String(row.image_url) : null,
      };
    })
    .filter(Boolean) as PopularCategoryConfig[];
}
