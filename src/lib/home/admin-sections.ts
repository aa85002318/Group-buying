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
    id: "hero",
    label: "Hero Banner",
    description: "首頁主視覺。桌機 1440×560、手機 750×700；可分開上傳。",
    contentMode: "banners",
    manageHref: "/admin/home/banners?placement=home_hero",
    manageLabel: "管理 Hero Banner",
    hasDisplayCount: true,
  },
  {
    id: "hot_searches",
    label: "熱門搜尋",
    description: "熱門標籤：名稱、關鍵字、連結類型與目標。",
    contentMode: "manual",
    hasKeywords: true,
    hasDisplayCount: true,
  },
  {
    id: "latest_recipes",
    label: "本週熱門食譜",
    description: "手動精選或自動抓取食譜；卡片顯示封面、時間、難度。",
    contentMode: "mixed",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasDataSource: true,
    manageHref: "/admin/recipes",
    manageLabel: "管理食譜",
  },
  {
    id: "recipe_kits",
    label: "一鍵購買材料",
    description: "材料包綁定食譜與商品 SKU，前台一鍵加入購物車。",
    contentMode: "cms_items",
    manageHref: "/admin/home/recipe-kits",
    manageLabel: "管理材料包",
    hasDisplayCount: true,
    hasViewAllUrl: true,
  },
  {
    id: "popular_categories",
    label: "找材料",
    description: "連結既有商品分類，設定顯示名稱、Icon 與背景色。",
    contentMode: "manual",
    hasCategories: true,
    hasDisplayCount: true,
    hasViewAllUrl: true,
  },
  {
    id: "popular_baking_products",
    label: "本週熱賣商品",
    description: "手動選取或自動依銷售；手機橫滑約 2.2 卡。",
    contentMode: "manual",
    hasProductPicker: true,
    productScope: "baking",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/products",
    manageLabel: "前往商品管理",
  },
  {
    id: "featured_courses",
    label: "最新課程",
    description: "從課程資料庫自動／手動選取。",
    contentMode: "mixed",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/courses",
    manageLabel: "管理課程",
  },
  {
    id: "closing_group_buys",
    label: "團購優惠",
    description: "顯示進行中團購；可設定顯示數與倒數。",
    contentMode: "mixed",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/group-buy",
    manageLabel: "管理團購活動",
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
    id: "trust_services",
    label: "安心服務",
    description: "服務保證條：標題／副標／Lucide Icon（存於區塊 config）。",
    contentMode: "manual",
    hasDisplayCount: true,
  },
  {
    id: "brand_statement",
    label: "品牌定位",
    description: "主標語與快捷標籤（預設隱藏，可再啟用）。",
    contentMode: "manual",
    hasBrandTags: true,
  },
  {
    id: "quick_menu",
    label: "快捷入口",
    description: "橫向快捷圖示選單（預設隱藏）。",
    contentMode: "cms_items",
    manageHref: "/admin/home/quick-menu",
    manageLabel: "管理快捷入口",
  },
  {
    id: "ai_assistant",
    label: "AI 烘焙助手",
    description: "區塊標題、輸入框提示與目標路徑（預設隱藏）。",
    contentMode: "manual",
    hasAiSettings: true,
    manageHref: "/admin/home/ai-prompts",
    manageLabel: "管理 AI 提問",
  },
  {
    id: "baking_inspiration",
    label: "今日烘焙靈感",
    description: "卡片式靈感推薦（預設隱藏）。",
    contentMode: "cms_items",
    manageHref: "/admin/home/inspirations",
    manageLabel: "管理烘焙靈感",
    hasDisplayCount: true,
  },
  {
    id: "weekly_new_products",
    label: "本週新品推薦",
    description: "依上架時間自動抓取（預設隱藏）。",
    contentMode: "mixed",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasDataSource: true,
    hasNewDays: true,
    manageHref: "/admin/products",
    manageLabel: "前往商品管理",
  },
  {
    id: "chime_select",
    label: "CHIME 精選",
    description: "CHIME 精選商品（預設隱藏）。",
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
    description: "直播區塊（預設隱藏）。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/livestreams",
    manageLabel: "管理直播",
  },
  {
    id: "weekly_promotions",
    label: "本週優惠",
    description: "橫向優惠 Banner（預設隱藏）。",
    contentMode: "banners",
    manageHref: "/admin/home/banners?placement=home_weekly_promo",
    manageLabel: "管理本週優惠 Banner",
    hasDisplayCount: true,
  },
  {
    id: "monthly_challenge",
    label: "本月烘焙挑戰",
    description: "烘焙挑戰（預設隱藏）。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/challenges",
    manageLabel: "管理烘焙挑戰",
  },
  {
    id: "seasonal_themes",
    label: "季節主題企劃",
    description: "季節主題（預設隱藏）。",
    contentMode: "auto",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    manageHref: "/admin/themes",
    manageLabel: "管理季節主題",
  },
  {
    id: "store_information",
    label: "門市資訊",
    description: "門市資訊區塊（預設隱藏）。",
    contentMode: "manual",
    hasViewAllUrl: true,
    manageHref: "/admin/stores",
    manageLabel: "管理門市",
  },
  {
    id: "latest_articles",
    label: "最新資訊",
    description: "文章管理（預設隱藏）。",
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
  icon?: string | null;
  iconBg?: string | null;
  categoryId?: string | null;
  showProductCount?: boolean;
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
        icon: row.icon ? String(row.icon) : null,
        iconBg: row.iconBg ? String(row.iconBg) : row.icon_bg ? String(row.icon_bg) : null,
        categoryId: row.categoryId
          ? String(row.categoryId)
          : row.category_id
            ? String(row.category_id)
            : null,
        showProductCount: row.showProductCount === true || row.show_product_count === true,
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
