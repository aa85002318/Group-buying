/**
 * Dual Mobile/Desktop Page Builder — reuse map (PHASE 0 scan).
 *
 * KEEP
 * - homepage_blocks + site_settings draft/publish (layout-versions)
 * - shop_layout_* / group_buy_page_* version stores
 * - cms_banners, products, recipes, members (shared content)
 * - CmsEditorShell / useCmsEditor / dnd-kit / CmsCanvas
 * - page_layout_settings table (desktop UI only)
 * - requireContentAdmin RBAC
 *
 * REUSE
 * - /admin/frontend-cms canvas → becomes /admin/page-builder
 * - cms-adapters, block-registry, page-registry
 * - CMS_DEVICE_SIZE preview frames
 *
 * ADD
 * - Unified Page Builder hub (6 groups)
 * - Wire draft/publish handlers on canvas (home/shop)
 * - Desktop layout draft/publish for page_layout_settings
 * - Platform switch Desktop | Mobile in builder
 * - Preview width presets 1024/1280/1440/1920 & 375/390/430
 *
 * MIGRATE LATER (do not break Mobile)
 * - Expand all page types into full block CMS
 * - Bidirectional click-to-select preview
 * - Brand assets / IP rules UI
 */

export const PAGE_BUILDER_BASE = "/admin/page-builder";

export type PageBuilderGroupId =
  | "home"
  | "shop"
  | "content"
  | "member"
  | "brand_info"
  | "global";

export const PAGE_BUILDER_GROUPS: Array<{
  id: PageBuilderGroupId;
  label: string;
  pageIds: string[];
}> = [
  { id: "home", label: "首頁", pageIds: ["home"] },
  {
    id: "shop",
    label: "購物",
    pageIds: ["shop", "product_template", "cart", "checkout"],
  },
  {
    id: "content",
    label: "內容",
    pageIds: ["recipes", "recipe_template", "activities", "brands", "ai_assistant"],
  },
  {
    id: "member",
    label: "會員",
    pageIds: ["member", "orders", "favorites"],
  },
  {
    id: "brand_info",
    label: "品牌資訊",
    pageIds: ["stores", "about", "contact", "faq", "shipping", "shopping_guide"],
  },
  {
    id: "global",
    label: "全站設定",
    pageIds: ["global_header", "global_footer", "global_announcement", "brand_assets"],
  },
];

/** Maps CMS page id → page_layout_settings.page_key (desktop). */
export const PAGE_BUILDER_DESKTOP_KEY: Record<string, string> = {
  home: "home",
  shop: "shop",
  product_template: "product_detail",
  recipes: "recipes",
  recipe_template: "recipe_detail",
  activities: "activities",
  brands: "brands",
  ai_assistant: "ai",
  stores: "stores",
  member: "member",
  orders: "orders",
  favorites: "favorites",
  cart: "cart",
  checkout: "checkout",
  shopping_guide: "shopping_guide",
  shipping: "shipping",
  faq: "faq",
  about: "about",
  contact: "contact",
};

/** Pages with wired Mobile (App) draft/publish today. */
export const PAGE_BUILDER_MOBILE_WIRABLE = new Set([
  "home",
  "shop",
  "group_buy",
]);

/** Pages that can load Desktop layout draft from page_layout_settings. */
export const PAGE_BUILDER_DESKTOP_WIRABLE = new Set(["home", "shop", "recipes"]);

export function pageBuilderHref(pageId: string) {
  return `${PAGE_BUILDER_BASE}/${pageId}`;
}