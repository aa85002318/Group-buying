import type { HomepageBlock } from "@/lib/types/database";
import type { HomeSectionKey } from "@/lib/home/section-keys";

export type { HomeSectionKey as HomeAdminSectionId };

export type HomeAdminSectionMeta = {
  /** Same as homepage_blocks.block_key */
  id: HomeSectionKey;
  label: string;
  description: string;
  /** How content is chosen on the front */
  contentMode: "auto" | "manual" | "mixed" | "cms_items" | "banners" | "external";
  manageHref?: string;
  manageLabel?: string;
  hasDisplayCount?: boolean;
  hasProductPicker?: boolean;
  /** Filter product picker by products.product_scope */
  productScope?: "baking" | "chime_select";
  hasKeywords?: boolean;
  hasCategories?: boolean;
  hasBrandTags?: boolean;
  hasAiSettings?: boolean;
  hasViewAllUrl?: boolean;
  hasDataSource?: boolean;
  hasNewDays?: boolean;
};

export const HOME_ADMIN_SECTIONS: HomeAdminSectionMeta[] = [
  {
    id: "hot_searches",
    label: "熱門搜尋",
    description: "設定關鍵字文字與顯示順序（上到下＝左到右）。",
    contentMode: "manual",
    hasKeywords: true,
    hasDisplayCount: true,
  },
  {
    id: "hero",
    label: "Hero Banner",
    description: "首頁主視覺輪播。圖片建議 1400×700 px，圖上不放文字。",
    contentMode: "banners",
    manageHref: "/admin/banners?placement=home_hero",
    manageLabel: "管理 Hero Banner",
    hasDisplayCount: true,
  },
  {
    id: "brand_statement",
    label: "品牌定位",
    description: "主標語與快捷標籤（AI 助手、食譜、門市、CHIME 精選等）。",
    contentMode: "manual",
    hasBrandTags: true,
  },
  {
    id: "quick_menu",
    label: "快捷入口",
    description: "橫向快捷圖示選單（圖示、標題、連結、排序）。",
    contentMode: "cms_items",
    manageHref: "/admin/home/quick-menu",
    manageLabel: "管理快捷入口",
  },
  {
    id: "ai_assistant",
    label: "AI 烘焙助手",
    description: "區塊標題、輸入框提示與目標路徑；快捷提問在 AI 提問管理。",
    contentMode: "manual",
    hasAiSettings: true,
    manageHref: "/admin/home/ai-prompts",
    manageLabel: "管理 AI 提問",
  },
  {
    id: "baking_inspiration",
    label: "今日烘焙靈感",
    description: "卡片式靈感推薦（標題、副標、圖片、連結）。",
    contentMode: "cms_items",
    manageHref: "/admin/home/inspirations",
    manageLabel: "管理烘焙靈感",
    hasDisplayCount: true,
  },
  {
    id: "popular_categories",
    label: "熱門烘焙分類",
    description: "圓形分類入口：名稱、連結、圖片與順序。",
    contentMode: "manual",
    hasCategories: true,
    hasDisplayCount: true,
    hasViewAllUrl: true,
  },
  {
    id: "latest_recipes",
    label: "最新食譜",
    description: "依上傳／發布時間自動排序。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasDataSource: true,
    manageHref: "/admin/recipes",
    manageLabel: "管理食譜",
  },
  {
    id: "weekly_new_products",
    label: "本週新品推薦",
    description: "依上架時間自動抓取最近 N 天新品，可混合手動置頂。",
    contentMode: "mixed",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasDataSource: true,
    hasNewDays: true,
    manageHref: "/admin/products",
    manageLabel: "前往商品管理",
  },
  {
    id: "popular_baking_products",
    label: "人氣烘焙材料",
    description: "自行選取烘焙材料商品與順序。",
    contentMode: "manual",
    hasProductPicker: true,
    productScope: "baking",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/products",
    manageLabel: "前往商品管理",
  },
  {
    id: "chime_select",
    label: "CHIME 精選",
    description: "自行選取 CHIME 精選商品與順序。",
    contentMode: "mixed",
    hasProductPicker: true,
    productScope: "chime_select",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/products",
    manageLabel: "前往商品管理",
  },
  {
    id: "weekly_live_streams",
    label: "本週團購直播",
    description: "顯示已排程／進行中的直播（自動抓取）。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/livestreams",
    manageLabel: "管理直播",
  },
  {
    id: "closing_group_buys",
    label: "即將結單",
    description: "顯示進行中的團購活動（自動抓取）。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/group-buy",
    manageLabel: "管理團購活動",
  },
  {
    id: "weekly_promotions",
    label: "本週優惠",
    description: "橫向優惠 Banner（placement: home_weekly_promo）。",
    contentMode: "banners",
    manageHref: "/admin/banners?placement=home_weekly_promo",
    manageLabel: "管理本週優惠 Banner",
    hasDisplayCount: true,
  },
  {
    id: "monthly_challenge",
    label: "本月烘焙挑戰",
    description: "顯示已發布的烘焙挑戰活動。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/challenges",
    manageLabel: "管理烘焙挑戰",
  },
  {
    id: "seasonal_themes",
    label: "季節主題企劃",
    description: "顯示已發布的季節主題企劃。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/themes",
    manageLabel: "管理季節主題",
  },
  {
    id: "latest_videos",
    label: "最新影音",
    description: "依上傳時間自動排序。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasDataSource: true,
    manageHref: "/admin/videos",
    manageLabel: "管理影音",
  },
  {
    id: "store_information",
    label: "門市資訊",
    description: "首頁門市資訊區塊；門市詳情在門市管理。",
    contentMode: "manual",
    hasViewAllUrl: true,
    manageHref: "/admin/stores",
    manageLabel: "管理門市",
  },
  {
    id: "latest_articles",
    label: "最新資訊",
    description: "連至文章管理：新增文章、置頂、調整排序。",
    contentMode: "external",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasDataSource: true,
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

export type BrandStatementTag = {
  id: string;
  label: string;
  href: string;
  sortOrder: number;
  active: boolean;
};

export function parseBrandStatementTags(
  config: Record<string, unknown> | null | undefined
): BrandStatementTag[] {
  const raw = config?.tags;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const href = String(row.href ?? "").trim();
      if (!label || !href) return null;
      return {
        id: String(row.id ?? `tag-${index}`),
        label,
        href,
        sortOrder: Number(row.sortOrder ?? row.sort_order ?? (index + 1) * 10) || (index + 1) * 10,
        active: row.active !== false,
      };
    })
    .filter(Boolean) as BrandStatementTag[];
}

export function parseBrandHeadline(
  config: Record<string, unknown> | null | undefined
): string {
  return String(config?.headline ?? "").trim();
}
