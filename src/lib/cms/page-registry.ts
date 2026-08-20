import type { CmsPage, CmsPageType, CmsPublishState } from "@/types/cms";

export type CmsPageRegistryEntry = {
  id: string;
  name: string;
  slug: string;
  pageType: CmsPageType;
  previewPath: string;
  editHref: string;
  categoryGroup:
    | "首頁"
    | "商城"
    | "商品"
    | "食譜"
    | "團購"
    | "會員"
    | "AI 功能"
    | "活動與內容"
    | "全站共用元件";
  systemRequired?: boolean;
  /** Has layout draft/publish today */
  hasLayoutCms?: boolean;
  /** Adapter key for loading blocks */
  adapter?: "home" | "shop" | "group_buy" | "recipes" | "chrome" | "none";
  allowedBlockTypes?: string[];
  description?: string;
};

export const CMS_PAGE_REGISTRY: CmsPageRegistryEntry[] = [
  {
    id: "home",
    name: "App 首頁",
    slug: "/",
    pageType: "home",
    previewPath: "/",
    editHref: "/admin/frontend-cms/home",
    categoryGroup: "首頁",
    systemRequired: true,
    hasLayoutCms: true,
    adapter: "home",
    description: "App 首頁區塊順序與顯示",
  },
  {
    id: "shop",
    name: "商城首頁",
    slug: "/shop",
    pageType: "shop",
    previewPath: "/shop",
    editHref: "/admin/frontend-cms/shop",
    categoryGroup: "商城",
    systemRequired: true,
    hasLayoutCms: true,
    adapter: "shop",
  },
  {
    id: "category",
    name: "商品分類頁",
    slug: "/categories",
    pageType: "category",
    previewPath: "/categories",
    editHref: "/admin/frontend-cms/category",
    categoryGroup: "商品",
    hasLayoutCms: false,
    adapter: "none",
    description: "尚未有版型 CMS（模板預留）",
  },
  {
    id: "product_template",
    name: "商品詳細頁模板",
    slug: "/products/[id]",
    pageType: "product_template",
    previewPath: "/products",
    editHref: "/admin/frontend-cms/product_template",
    categoryGroup: "商品",
    hasLayoutCms: false,
    adapter: "none",
    description: "模板 CMS（不修改商品本體）",
  },
  {
    id: "recipes",
    name: "食譜首頁",
    slug: "/recipes",
    pageType: "recipes",
    previewPath: "/recipes",
    editHref: "/admin/frontend-cms/recipes",
    categoryGroup: "食譜",
    hasLayoutCms: true,
    adapter: "recipes",
    description: "目前以 Hero 設定為主（live）",
  },
  {
    id: "recipe_category",
    name: "食譜分類頁",
    slug: "/recipes?category=",
    pageType: "recipe_category",
    previewPath: "/recipes",
    editHref: "/admin/frontend-cms/recipe_category",
    categoryGroup: "食譜",
    hasLayoutCms: false,
    adapter: "none",
  },
  {
    id: "recipe_template",
    name: "食譜詳細頁模板",
    slug: "/recipes/[id]",
    pageType: "recipe_template",
    previewPath: "/recipes",
    editHref: "/admin/frontend-cms/recipe_template",
    categoryGroup: "食譜",
    hasLayoutCms: false,
    adapter: "none",
    description: "翻頁版型見 /admin/recipes/layouts",
  },
  {
    id: "group_buy",
    name: "團購首頁",
    slug: "/group-buy",
    pageType: "group_buy",
    previewPath: "/group-buy",
    editHref: "/admin/frontend-cms/group_buy",
    categoryGroup: "團購",
    systemRequired: true,
    hasLayoutCms: true,
    adapter: "group_buy",
  },
  {
    id: "member",
    name: "會員中心",
    slug: "/member",
    pageType: "member",
    previewPath: "/member",
    editHref: "/admin/frontend-cms/member",
    categoryGroup: "會員",
    hasLayoutCms: false,
    adapter: "none",
  },
  {
    id: "ai_assistant",
    name: "AI 烘焙小幫手",
    slug: "/shop#ai",
    pageType: "ai_assistant",
    previewPath: "/shop",
    editHref: "/admin/frontend-cms/ai_assistant",
    categoryGroup: "AI 功能",
    hasLayoutCms: false,
    adapter: "none",
    description: "內容見商城 AI 助手／Chips 編輯",
  },
  {
    id: "article",
    name: "活動／文章頁",
    slug: "/articles",
    pageType: "article",
    previewPath: "/articles",
    editHref: "/admin/frontend-cms/article",
    categoryGroup: "活動與內容",
    hasLayoutCms: false,
    adapter: "none",
  },
  {
    id: "global_header",
    name: "共用 Header",
    slug: "chrome:header",
    pageType: "global_component",
    previewPath: "/",
    editHref: "/admin/frontend-cms/global_header",
    categoryGroup: "全站共用元件",
    systemRequired: true,
    hasLayoutCms: false,
    adapter: "chrome",
  },
  {
    id: "global_side_menu",
    name: "共用側邊選單",
    slug: "chrome:side-menu",
    pageType: "global_component",
    previewPath: "/",
    editHref: "/admin/frontend-cms/global_side_menu",
    categoryGroup: "全站共用元件",
    systemRequired: true,
    hasLayoutCms: false,
    adapter: "chrome",
  },
  {
    id: "global_bottom_nav",
    name: "手機底部導覽",
    slug: "chrome:bottom-nav",
    pageType: "global_component",
    previewPath: "/",
    editHref: "/admin/frontend-cms/global_bottom_nav",
    categoryGroup: "全站共用元件",
    systemRequired: true,
    hasLayoutCms: false,
    adapter: "chrome",
  },
  {
    id: "global_footer",
    name: "共用 Footer",
    slug: "chrome:footer",
    pageType: "global_component",
    previewPath: "/",
    editHref: "/admin/frontend-cms/global_footer",
    categoryGroup: "全站共用元件",
    systemRequired: true,
    hasLayoutCms: false,
    adapter: "chrome",
  },
];

export function getPageRegistryEntry(
  pageId: string
): CmsPageRegistryEntry | undefined {
  return CMS_PAGE_REGISTRY.find((p) => p.id === pageId);
}

export function listPagesByCategory(): Record<string, CmsPageRegistryEntry[]> {
  const map: Record<string, CmsPageRegistryEntry[]> = {};
  for (const page of CMS_PAGE_REGISTRY) {
    const list = map[page.categoryGroup] ?? [];
    list.push(page);
    map[page.categoryGroup] = list;
  }
  return map;
}

export function registryEntryToCmsPage(
  entry: CmsPageRegistryEntry,
  extra: Partial<CmsPage> = {}
): CmsPage {
  const publishState: CmsPublishState = entry.hasLayoutCms
    ? "published"
    : "unset";
  return {
    id: entry.id,
    name: entry.name,
    slug: entry.slug,
    pageType: entry.pageType,
    status: entry.hasLayoutCms ? "published" : "unset",
    blocks: [],
    settings: {},
    previewPath: entry.previewPath,
    editHref: entry.editHref,
    publishState,
    categoryGroup: entry.categoryGroup,
    systemRequired: entry.systemRequired,
    hasLayoutCms: entry.hasLayoutCms,
    blockCount: 0,
    ...extra,
  };
}
