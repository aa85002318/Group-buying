/**
 * Dual Mobile/Desktop Page Builder.
 *
 * Architecture:
 * - Two independent pipelines: /admin/page-builder/desktop | /mobile
 * - Shared content (products, recipes, …) — never duplicated
 * - Separate layout settings, sort, visibility, hero, image overrides
 */

export const PAGE_BUILDER_BASE = "/admin/page-builder";

export type PageBuilderPlatform = "desktop" | "mobile";

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
    label: "全站",
    pageIds: ["global_header", "global_footer", "global_announcement", "brand_assets"],
  },
];

/** Maps CMS page id → page_layout_settings.page_key */
export const PAGE_BUILDER_LAYOUT_KEY: Record<string, string> = {
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

/** @deprecated use PAGE_BUILDER_LAYOUT_KEY */
export const PAGE_BUILDER_DESKTOP_KEY = PAGE_BUILDER_LAYOUT_KEY;

export const PAGE_BUILDER_MOBILE_WIRABLE = new Set([
  "home",
  "shop",
  "group_buy",
]);

export const PAGE_BUILDER_DESKTOP_WIRABLE = new Set([
  "home",
  "shop",
  "recipes",
]);

export const PAGE_BUILDER_PREVIEW_WIDTHS: Record<PageBuilderPlatform, number[]> = {
  desktop: [1024, 1280, 1440, 1920],
  mobile: [375, 390, 430, 768],
};

export const PAGE_BUILDER_DEFAULT_WIDTH: Record<PageBuilderPlatform, number> = {
  desktop: 1440,
  mobile: 390,
};

export function isPageWirable(
  pageId: string,
  platform: PageBuilderPlatform
): boolean {
  return platform === "desktop"
    ? PAGE_BUILDER_DESKTOP_WIRABLE.has(pageId)
    : PAGE_BUILDER_MOBILE_WIRABLE.has(pageId);
}

export function pageBuilderPlatformHref(platform: PageBuilderPlatform) {
  return `${PAGE_BUILDER_BASE}/${platform}`;
}

export function pageBuilderHref(
  pageId: string,
  platform: PageBuilderPlatform = "desktop"
) {
  return `${PAGE_BUILDER_BASE}/${platform}/${pageId}`;
}

export function platformLabel(platform: PageBuilderPlatform) {
  return platform === "desktop" ? "網頁版 Desktop" : "手機 App / Mobile";
}
