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
  /** Series product exposure: category + badge + scope */
  hasProductSeriesSettings?: boolean;
  /** Ingredient shop: source, sort, more card */
  hasIngredientShopSettings?: boolean;
  /** Group-buy banner carousel */
  hasGroupBuyBannerSettings?: boolean;
  /** Banner strip: custom placement */
  hasBannerPlacement?: boolean;
  /** Hero banner images via brand_heroes */
  hasHeroEditor?: boolean;
  /** Latest campaigns carousel CRUD */
  hasLatestCampaignSettings?: boolean;
  /** Quick services + member center */
  hasQuickServicesSettings?: boolean;
  /** Recipe picker from catalog */
  hasRecipePicker?: boolean;
  /** Category chip menu above products */
  hasCategoryMenu?: boolean;
  /** Content driven by group-buy / livestream admin */
  hasExternalSourcePanel?: boolean;
  /** Service shortcuts item CRUD */
  hasServiceShortcutsSettings?: boolean;
  /** Shown in "add block" catalog */
  catalog?: boolean;
};

/** Canonical homepage CMS sections — matches live staging order. */
export const PRIMARY_HOME_ADMIN_SECTIONS: HomeAdminSectionMeta[] = [
  {
    id: "hero",
    label: "主視覺 Banner",
    description:
      "首頁最上方主視覺。可上傳桌機／手機圖並調整標題與搜尋。建議桌機 1500×600、手機 1080×900。",
    contentMode: "external",
    hasHeroEditor: true,
    catalog: true,
  },
  {
    id: "latest_campaigns",
    label: "最新活動",
    description:
      "搜尋列下方活動輪播。可新增／刪除圖片，並指定文章、站內頁或商品連結。建議 1200×600（2:1）。",
    contentMode: "manual",
    hasLatestCampaignSettings: true,
    hasViewAllUrl: true,
    catalog: true,
  },
  {
    id: "quick_entry",
    label: "常用服務",
    description:
      "圓形常用服務＋會員中心卡。可指定連結、上傳素材、更換底色（內建色卡）。",
    contentMode: "manual",
    hasQuickServicesSettings: true,
    catalog: true,
  },
  {
    id: "latest_recipes",
    label: "精選食譜",
    description: "從已上傳食譜新增或刪除精選；可切自動／手動。",
    contentMode: "mixed",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasDataSource: true,
    hasRecipePicker: true,
    catalog: true,
  },
  {
    id: "ingredient_shop",
    label: "一鍵買齊材料",
    description: "商品橫滑區；上方分類選單可指定商品分類連結。",
    contentMode: "mixed",
    hasProductPicker: true,
    productScope: "baking",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasIngredientShopSettings: true,
    hasCategoryMenu: true,
    catalog: true,
  },
  {
    id: "group_buy_banner",
    label: "團購輪播 Banner",
    description: "可上傳或刪除輪播圖（建議 1500×600／5:2）與下方優勢文案。",
    contentMode: "manual",
    hasViewAllUrl: true,
    hasGroupBuyBannerSettings: true,
    catalog: true,
  },
  {
    id: "weekly_group_buys",
    label: "本週開團",
    description: "內容依團購設定自動帶入；此處可改標題與顯示筆數。",
    contentMode: "external",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasExternalSourcePanel: true,
    manageHref: "/admin/group-buy",
    manageLabel: "前往團購活動管理",
    catalog: true,
  },
  {
    id: "closing_group_buys",
    label: "即將結單",
    description: "內容依團購設定自動帶入；此處可改標題與顯示筆數。",
    contentMode: "external",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasExternalSourcePanel: true,
    manageHref: "/admin/group-buy",
    manageLabel: "前往團購活動管理",
    catalog: true,
  },
  {
    id: "weekly_live_streams",
    label: "LIVE 團購直播",
    description: "內容依直播設定自動帶入；此處可改標題與顯示筆數。",
    contentMode: "external",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasExternalSourcePanel: true,
    manageHref: "/admin/livestreams",
    manageLabel: "前往直播管理",
    catalog: true,
  },
  {
    id: "chime_select",
    label: "CHIMEIDIY 團購精選",
    description: "團購精選列表；上方選單可指定分類連結。內容引用團購活動。",
    contentMode: "external",
    hasDisplayCount: true,
    hasViewAllUrl: true,
    hasCategoryMenu: true,
    hasExternalSourcePanel: true,
    manageHref: "/admin/group-buy",
    manageLabel: "前往團購活動管理",
    catalog: true,
  },
  {
    id: "service_shortcuts",
    label: "快捷服務入口",
    description:
      "頁面底部 1:1 快捷按鈕。可指定連結、上傳素材。圖片建議 400×400。",
    contentMode: "manual",
    hasServiceShortcutsSettings: true,
    hasDisplayCount: true,
    catalog: true,
  },
];

// Legacy section metadata removed from admin catalog — kept only if needed for migrations.
const LEGACY_HOME_ADMIN_SECTIONS: HomeAdminSectionMeta[] = [
  {
    id: "store_news",
    label: "門市最新資訊（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "hot_searches",
    label: "熱門搜尋（舊）",
    description: "已由常用服務取代。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "recipe_kits",
    label: "一鍵買齊材料（材料包・舊）",
    description: "已由一鍵買齊材料區塊取代。",
    contentMode: "cms_items",
    catalog: false,
  },
  {
    id: "popular_categories",
    label: "找材料（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "popular_baking_products",
    label: "本週熱門商品（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "product_series",
    label: "系列商品曝光（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "mixed",
    catalog: false,
  },
  {
    id: "featured_courses",
    label: "最新課程（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "mixed",
    catalog: false,
  },
  {
    id: "latest_videos",
    label: "最新影音（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "auto",
    catalog: false,
  },
  {
    id: "trust_services",
    label: "安心服務（舊）",
    description: "已由快捷服務入口取代。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "brand_statement",
    label: "品牌定位（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "quick_menu",
    label: "快捷入口（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "cms_items",
    catalog: false,
  },
  {
    id: "ai_assistant",
    label: "AI 烘焙助手（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "baking_inspiration",
    label: "今日烘焙靈感（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "cms_items",
    catalog: false,
  },
  {
    id: "weekly_new_products",
    label: "本週新品推薦（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "mixed",
    catalog: false,
  },
  {
    id: "weekly_promotions",
    label: "本週優惠（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "banners",
    catalog: false,
  },
  {
    id: "banner_strip",
    label: "Banner 帶（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "banners",
    catalog: false,
  },
  {
    id: "monthly_challenge",
    label: "本月烘焙挑戰（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "auto",
    catalog: false,
  },
  {
    id: "seasonal_themes",
    label: "季節主題企劃（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "auto",
    catalog: false,
  },
  {
    id: "store_information",
    label: "門市資訊（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "manual",
    catalog: false,
  },
  {
    id: "latest_articles",
    label: "最新資訊（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "external",
    catalog: false,
  },
  {
    id: "ingredient_categories",
    label: "找材料分類（舊）",
    description: "已不在前台主堆疊。",
    contentMode: "manual",
    catalog: false,
  },
];

export const HOME_ADMIN_SECTIONS: HomeAdminSectionMeta[] = [
  ...PRIMARY_HOME_ADMIN_SECTIONS,
  ...LEGACY_HOME_ADMIN_SECTIONS,
];

export function getSectionMeta(blockKey: string): HomeAdminSectionMeta | undefined {
  return HOME_ADMIN_SECTIONS.find((s) => s.id === blockKey);
}

export function findBlock(
  blocks: HomepageBlock[],
  blockKey: string
): HomepageBlock | undefined {
  return blocks.find((b) => b.block_key === blockKey);
}

export function findBlockById(
  blocks: HomepageBlock[],
  id: string
): HomepageBlock | undefined {
  return blocks.find((b) => b.id === id);
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
