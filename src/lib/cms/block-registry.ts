import type { CmsBlockCategory } from "@/types/cms";

export type CmsBlockDefinition = {
  type: string;
  name: string;
  category: CmsBlockCategory;
  description?: string;
  /** Maps to legacy home/shop/group-buy section keys */
  legacyKeys?: string[];
  /** Pages that may use this block; empty = all layout pages */
  allowedPageIds?: string[];
  disabledReason?: string;
  catalog?: boolean;
};

const def = (
  type: string,
  name: string,
  category: CmsBlockCategory,
  extra: Partial<CmsBlockDefinition> = {}
): CmsBlockDefinition => ({
  type,
  name,
  category,
  catalog: true,
  ...extra,
});

/** Full block registry — many renderers land in later phases; types are registered now. */
export const CMS_BLOCK_REGISTRY: CmsBlockDefinition[] = [
  // 基礎內容
  def("heading", "標題", "basic"),
  def("text", "文字", "basic"),
  def("image", "圖片", "basic"),
  def("button", "按鈕", "basic"),
  def("image_text", "圖文組合", "basic"),
  def("divider", "分隔線", "basic"),
  def("spacer", "間距", "basic"),
  def("html_embed", "HTML／嵌入內容", "basic"),

  // 導覽與入口
  def("hero_banner", "Hero Banner", "nav", {
    legacyKeys: ["hero"],
  }),
  def("promo_banner", "活動 Banner", "nav", {
    legacyKeys: ["promo", "latest_campaigns", "banner_strip"],
  }),
  def("carousel_banner", "輪播 Banner", "nav", {
    legacyKeys: ["group_buy_banner"],
  }),
  def("search_bar", "搜尋與熱門關鍵字", "nav", {
    legacyKeys: ["hot_searches", "shop_search"],
    allowedPageIds: ["shop", "home"],
  }),
  def("category_entry", "分類入口", "nav", {
    legacyKeys: ["categories", "popular_categories", "ingredient_categories"],
  }),
  def("quick_services", "快捷入口", "nav", {
    legacyKeys: ["quick_entry", "quick_links", "service_shortcuts", "quick_menu"],
  }),
  def("tab_menu", "頁籤選單", "nav", { legacyKeys: ["tabs"] }),
  def("breadcrumb", "麵包屑", "nav"),
  def("side_category_menu", "側邊分類選單", "nav"),

  // 商品
  def("product_categories", "商品分類", "product", {
    legacyKeys: ["categories"],
    allowedPageIds: ["shop", "home", "category"],
  }),
  def("product_list", "商品列表", "product"),
  def("popular_products", "熱門商品", "product", {
    legacyKeys: ["popular", "popular_baking_products"],
  }),
  def("new_products", "本週上新", "product", {
    legacyKeys: ["new", "weekly_new_products"],
  }),
  def("sale_products", "優惠商品", "product", {
    legacyKeys: ["sale"],
    allowedPageIds: ["shop"],
  }),
  def("bundle_products", "組合優惠", "product", {
    legacyKeys: ["bundle"],
    allowedPageIds: ["shop"],
  }),
  def("recommended_products", "精選商品", "product", {
    legacyKeys: ["featured"],
  }),
  def("ingredient_shop", "一鍵買齊材料", "product", {
    legacyKeys: ["ingredient_shop"],
  }),
  def("recent_products", "最近瀏覽商品", "product"),
  def("product_carousel", "商品橫向輪播", "product", {
    legacyKeys: ["chime_select", "product_series"],
  }),
  def("brand_zone", "品牌專區", "product"),
  def("shop_features", "商城特色", "product", { legacyKeys: ["features"] }),
  def("info_banners", "訂購／企業 Banner", "service", {
    legacyKeys: ["info-banners"],
  }),

  // 食譜
  def("featured_recipes", "精選食譜", "recipe", {
    legacyKeys: ["latest_recipes"],
  }),
  def("latest_recipes", "最新食譜", "recipe"),
  def("popular_recipes", "熱門食譜", "recipe"),
  def("recipe_categories", "食譜分類", "recipe"),
  def("recipe_search", "食譜搜尋", "recipe"),
  def("inspiration_wall", "烘焙靈感牆", "recipe", {
    legacyKeys: ["inspiration", "baking_inspiration"],
  }),
  def("ai_recipe_finder", "AI 找食譜", "recipe", {
    legacyKeys: ["ai-assistant", "ai_assistant"],
  }),
  def("recipe_ingredients", "食譜材料清單", "recipe", {
    allowedPageIds: ["recipe_template"],
  }),
  def("recipe_steps", "食譜步驟", "recipe", {
    allowedPageIds: ["recipe_template"],
  }),
  def("related_recipes", "相關食譜", "recipe"),

  // 團購
  def("group_buy_tabs", "團購狀態分頁", "group_buy", { legacyKeys: ["tabs"] }),
  def("group_buy_search", "團購搜尋與篩選", "group_buy", {
    legacyKeys: ["search_filters"],
  }),
  def("weekly_group_buys", "本週開團", "group_buy", {
    legacyKeys: ["weekly_group_buys"],
  }),
  def("active_group_buys", "進行中團購", "group_buy", {
    legacyKeys: ["group_buy_list"],
  }),
  def("ending_group_buys", "即將結團", "group_buy", {
    legacyKeys: ["ending_soon", "closing_group_buys"],
  }),
  def("upcoming_group_buys", "即將開團", "group_buy", {
    legacyKeys: ["upcoming"],
  }),
  def("group_buy_list", "團購商品列表", "group_buy"),
  def("group_buy_banner", "團購活動 Banner", "group_buy"),
  def("group_buy_live", "團購直播", "group_buy", {
    legacyKeys: ["weekly_live_streams"],
  }),
  def("share_rebate", "分享返利說明", "group_buy"),
  def("purchase_notice", "訂購須知", "service", {
    legacyKeys: ["purchase_notice"],
  }),
  def("group_buy_header", "團購頁首", "group_buy", { legacyKeys: ["header"] }),

  // 會員
  def("member_welcome", "會員歡迎區", "member", {
    allowedPageIds: ["member"],
  }),
  def("member_profile", "會員資料", "member", { allowedPageIds: ["member"] }),
  def("order_shortcuts", "訂單捷徑", "member", { allowedPageIds: ["member"] }),
  def("points_rewards", "點數／獎勵金", "member", {
    allowedPageIds: ["member"],
  }),
  def("coupons", "優惠券", "member", { allowedPageIds: ["member"] }),
  def("favorite_products", "收藏商品", "member", {
    allowedPageIds: ["member"],
  }),
  def("favorite_recipes", "收藏食譜", "member", {
    allowedPageIds: ["member"],
  }),
  def("recent_orders", "最近訂單", "member", { allowedPageIds: ["member"] }),

  // 服務與內容
  def("latest_campaigns", "最新活動", "service", {
    legacyKeys: ["latest_campaigns", "store_news"],
  }),
  def("store_pickup", "門市取貨", "service"),
  def("corporate_order", "企業訂購", "service"),
  def("faq", "FAQ", "service"),
  def("article_list", "文章列表", "service", {
    legacyKeys: ["latest_articles"],
  }),
  def("contact_info", "聯絡資訊", "service"),
  def("map", "地圖", "service", { legacyKeys: ["store_information"] }),
  def("social_links", "社群連結", "service"),
  def("trust_services", "信任服務", "service", {
    legacyKeys: ["trust_services"],
  }),

  // 全站元件
  def("site_header", "Header", "global", {
    allowedPageIds: ["global_header"],
  }),
  def("site_footer", "Footer", "global", {
    allowedPageIds: ["global_footer"],
  }),
  def("mobile_bottom_nav", "手機底部導覽", "global", {
    allowedPageIds: ["global_bottom_nav"],
  }),
  def("site_side_menu", "全站側邊選單", "global", {
    allowedPageIds: ["global_side_menu"],
  }),
  def("announcement_bar", "公告列", "global"),
  def("cookie_notice", "Cookie／隱私提示", "global"),
];

const byType = new Map(CMS_BLOCK_REGISTRY.map((b) => [b.type, b]));
const byLegacy = new Map<string, CmsBlockDefinition>();
for (const b of CMS_BLOCK_REGISTRY) {
  for (const key of b.legacyKeys ?? []) {
    if (!byLegacy.has(key)) byLegacy.set(key, b);
  }
}

export function getBlockDefinition(type: string): CmsBlockDefinition | undefined {
  return byType.get(type);
}

export function resolveBlockTypeFromLegacyKey(legacyKey: string): string {
  return byLegacy.get(legacyKey)?.type ?? legacyKey;
}

export function getBlocksForPage(pageId: string): CmsBlockDefinition[] {
  return CMS_BLOCK_REGISTRY.filter((b) => {
    if (!b.allowedPageIds || b.allowedPageIds.length === 0) return true;
    return b.allowedPageIds.includes(pageId);
  });
}

export function isBlockAllowedOnPage(
  blockType: string,
  pageId: string
): { ok: boolean; reason?: string } {
  const defn = byType.get(blockType);
  if (!defn) return { ok: false, reason: "未知區塊類型" };
  if (!defn.allowedPageIds || defn.allowedPageIds.length === 0) {
    return { ok: true };
  }
  if (defn.allowedPageIds.includes(pageId)) return { ok: true };
  return {
    ok: false,
    reason: defn.disabledReason || "此區塊不適用於目前頁面",
  };
}

export const BLOCK_CATEGORY_LABELS: Record<CmsBlockCategory, string> = {
  basic: "基礎內容",
  nav: "導覽與入口",
  product: "商品",
  recipe: "食譜",
  group_buy: "團購",
  member: "會員",
  service: "服務與內容",
  global: "全站元件",
};

export function listBlocksByCategory(): Record<string, CmsBlockDefinition[]> {
  const map: Record<string, CmsBlockDefinition[]> = {};
  for (const block of CMS_BLOCK_REGISTRY) {
    const list = map[block.category] ?? [];
    list.push(block);
    map[block.category] = list;
  }
  return map;
}
