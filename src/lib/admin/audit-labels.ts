/** Chinese labels & module grouping for admin audit logs. */

export type AuditModuleId =
  | "cms"
  | "store"
  | "commerce"
  | "content"
  | "system"
  | "other";

export const AUDIT_MODULES: Array<{ id: AuditModuleId; label: string }> = [
  { id: "cms", label: "前台 CMS／素材" },
  { id: "store", label: "門市協作" },
  { id: "commerce", label: "訂單／會員／團購" },
  { id: "content", label: "內容（食譜／文章）" },
  { id: "system", label: "系統／設定" },
  { id: "other", label: "其他" },
];

const CMS_TYPES = new Set([
  "homepage_layout",
  "homepage_layout_draft",
  "group_buy_page_settings",
  "group_buy_page_draft",
  "cms_banner",
  "cms_page",
  "cms_pages",
  "media_assets",
  "shop_page_settings",
  "shop_home_settings",
  "shop_popular_keywords",
  "shop_feature",
  "shop_ai_chip",
  "shop_inspiration_post",
  "home_inspirations",
  "home_ai_prompts",
  "home_quick_menu_items",
  "home_recipe_kits",
  "homepage_popup",
  "site_header_settings",
  "site_legal_document",
  "site_legal_documents",
]);

const STORE_TYPES = new Set([
  "stores",
  "store_batches",
  "store_disposals",
  "store_anomalies",
  "store_returns",
  "store_requests",
  "store_todos",
  "store_work_logs",
  "store_customer_requests",
  "store_import",
  "store_import_jobs",
]);

const COMMERCE_TYPES = new Set([
  "order",
  "orders",
  "profile",
  "product",
  "products",
  "product_category",
  "group_buy_event",
  "commission_record",
  "commission_rule",
  "payment_report",
  "supplier",
]);

const CONTENT_TYPES = new Set([
  "article",
  "recipe",
  "recipe_media",
  "video",
  "news",
  "faq",
  "livestream",
  "member_benefit",
  "notification",
  "notification_campaign",
  "push_notification",
]);

const SYSTEM_TYPES = new Set([
  "email_templates",
  "ecpay_integration_settings",
  "support_ticket",
  "support_settings",
  "brand",
  "brand_heroes",
  "seasonal_themes",
  "baking_challenges",
  "corporate_inquiry",
]);

export function auditModuleForEntity(entityType: string): AuditModuleId {
  const t = entityType.trim();
  if (CMS_TYPES.has(t) || t.startsWith("shop_") || t.startsWith("home_")) return "cms";
  if (STORE_TYPES.has(t) || t.startsWith("store_")) return "store";
  if (COMMERCE_TYPES.has(t)) return "commerce";
  if (CONTENT_TYPES.has(t)) return "content";
  if (SYSTEM_TYPES.has(t)) return "system";
  return "other";
}

export function entityTypesForModule(module: AuditModuleId): string[] | null {
  if (module === "other") return null;
  const map: Record<Exclude<AuditModuleId, "other">, Set<string>> = {
    cms: CMS_TYPES,
    store: STORE_TYPES,
    commerce: COMMERCE_TYPES,
    content: CONTENT_TYPES,
    system: SYSTEM_TYPES,
  };
  return Array.from(map[module]);
}

const ACTION_LABELS: Record<string, string> = {
  create: "建立",
  update: "更新",
  delete: "刪除",
  publish: "發布",
  schedule: "排程",
  restore: "還原",
  import: "匯入",
  login: "登入",
  clawback_commission: "分潤回收",
  update_order_status: "更新訂單狀態",
  mark_pickup: "標記取貨",
  report_pickup_issue: "回報取貨異常",
  broadcast_member_notification: "廣播會員通知",
  send_push: "發送推播",
};

const ENTITY_LABELS: Record<string, string> = {
  order: "App 訂單",
  profile: "App 會員",
  product: "商品",
  products: "商品",
  article: "文章",
  recipe: "食譜",
  recipe_media: "食譜素材",
  video: "影音",
  group_buy_event: "團購活動",
  homepage_layout: "首頁版面",
  homepage_layout_draft: "首頁草稿",
  group_buy_page_settings: "團購頁設定",
  group_buy_page_draft: "團購頁草稿",
  cms_banner: "CMS Banner",
  media_assets: "素材庫",
  store_batches: "門市批次",
  store_disposals: "報廢",
  store_anomalies: "異常／報修",
  store_returns: "退貨",
  store_requests: "分店需求",
  store_todos: "待辦",
  store_work_logs: "工作紀錄",
  store_customer_requests: "客戶服務",
  stores: "分店",
  shop_page_settings: "商城頁設定",
  shop_home_settings: "商城 IP 歡迎區",
  shop_popular_keywords: "商城熱門搜尋",
  shop_layout: "商城版面",
  shop_layout_draft: "商城版面草稿",
  notification_campaign: "通知活動",
  member_benefit: "會員福利",
  support_ticket: "客服工單",
  supplier: "供應商",
  product_category: "商品分類",
};

export function labelAuditAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  if (action.startsWith("create_")) return `建立 ${action.slice(7)}`;
  if (action.startsWith("update_")) return `更新 ${action.slice(7)}`;
  if (action.startsWith("delete_")) return `刪除 ${action.slice(7)}`;
  return action;
}

export function labelAuditEntity(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

export const COMMON_AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "publish",
  "schedule",
  "restore",
  "import",
] as const;
