export type AdminRole = "admin" | "store_staff" | "content_editor" | "customer_service";

export const STORE_STAFF_ADMIN_PATHS = [
  "/admin",
  "/admin/orders",
  "/admin/payments",
  "/admin/pickup",
  "/admin/store",
  "/admin/payment-records",
] as const;

export const CONTENT_EDITOR_ADMIN_PATHS = [
  "/admin",
  "/admin/recipes",
  "/admin/videos",
  "/admin/news",
  "/admin/banners",
  "/admin/home",
  "/admin/faqs",
  "/admin/cms",
  "/admin/articles",
] as const;

export const CUSTOMER_SERVICE_ADMIN_PATHS = [
  "/admin",
  "/admin/orders",
  "/admin/members",
  "/admin/support",
  "/admin/support-settings",
  "/admin/notifications",
  "/admin/faqs",
] as const;

export function isPathAllowed(path: string, allowed: readonly string[]): boolean {
  return allowed.some((p) => path === p || (p !== "/admin" && path.startsWith(`${p}/`)));
}

export function isStoreStaffAllowedPath(path: string): boolean {
  return isPathAllowed(path, STORE_STAFF_ADMIN_PATHS);
}

export function isContentEditorAllowedPath(path: string): boolean {
  return isPathAllowed(path, CONTENT_EDITOR_ADMIN_PATHS);
}

export function isCustomerServiceAllowedPath(path: string): boolean {
  return isPathAllowed(path, CUSTOMER_SERVICE_ADMIN_PATHS);
}

export const ADMIN_ROLES = ["admin", "store_staff", "content_editor", "customer_service"] as const;

export type AdminNavItem = {
  href: string;
  label: string;
  /** If omitted, visible to all admin-capable roles that can reach /admin */
  roles?: AdminRole[];
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "儀表板" },
  { href: "/admin/header-promos", label: "開團快捷資訊", roles: ["admin"] },
  { href: "/admin/side-menu", label: "側邊選單", roles: ["admin"] },
  { href: "/admin/products", label: "商品管理", roles: ["admin"] },
  { href: "/admin/products/analysis", label: "商品分析", roles: ["admin"] },
  { href: "/admin/brands", label: "品牌管理", roles: ["admin"] },
  { href: "/admin/suppliers", label: "供應商", roles: ["admin"] },
  { href: "/admin/inventory", label: "庫存報表", roles: ["admin"] },
  { href: "/admin/categories", label: "分類管理", roles: ["admin"] },
  { href: "/admin/articles", label: "文章管理", roles: ["admin", "content_editor"] },
  { href: "/admin/recipes", label: "食譜管理", roles: ["admin", "content_editor"] },
  { href: "/admin/news", label: "最新資訊", roles: ["admin", "content_editor"] },
  { href: "/admin/banners", label: "Banner 管理", roles: ["admin", "content_editor"] },
  { href: "/admin/home", label: "首頁管理", roles: ["admin", "content_editor"] },
  { href: "/admin/benefits", label: "會員福利", roles: ["admin"] },
  { href: "/admin/group-buy", label: "團購", roles: ["admin"] },
  { href: "/admin/stores", label: "取貨點", roles: ["admin"] },
  { href: "/admin/store", label: "門市管理", roles: ["admin", "store_staff"] },
  { href: "/admin/cms", label: "統一 CMS", roles: ["admin", "content_editor"] },
  { href: "/admin/faqs", label: "FAQ", roles: ["admin", "content_editor", "customer_service"] },
  { href: "/admin/support-settings", label: "客服設定", roles: ["admin", "customer_service"] },
  { href: "/admin/orders", label: "App 訂單", roles: ["admin", "store_staff", "customer_service"] },
  { href: "/admin/payments", label: "付款", roles: ["admin", "store_staff"] },
  { href: "/admin/pickup", label: "取貨", roles: ["admin", "store_staff"] },
  { href: "/admin/payment-records", label: "金流紀錄", roles: ["admin"] },
  { href: "/admin/integrations/ecpay", label: "綠界串接", roles: ["admin"] },
  { href: "/admin/staff", label: "門市人員", roles: ["admin"] },
  { href: "/admin/videos", label: "影音", roles: ["admin", "content_editor"] },
  { href: "/admin/livestreams", label: "直播", roles: ["admin"] },
  { href: "/admin/notifications", label: "通知管理", roles: ["admin", "customer_service"] },
  { href: "/admin/email-templates", label: "郵件版型", roles: ["admin"] },
  { href: "/admin/members", label: "App 會員", roles: ["admin", "customer_service"] },
  { href: "/admin/audit-logs", label: "操作紀錄", roles: ["admin"] },
  { href: "/admin/share-tracking", label: "分享追蹤", roles: ["admin"] },
  { href: "/admin/rewards", label: "獎勵", roles: ["admin"] },
  { href: "/admin/commission-rules", label: "分潤規則", roles: ["admin"] },
  { href: "/admin/commission-records", label: "分潤紀錄", roles: ["admin"] },
  { href: "/admin/support", label: "客服", roles: ["admin", "customer_service"] },
  { href: "/admin/corporate", label: "企業詢價", roles: ["admin"] },
  { href: "/admin/courses", label: "課程", roles: ["admin"] },
  { href: "/admin/reports", label: "報表", roles: ["admin"] },
];

export function navForRole(role: string): AdminNavItem[] {
  if (role === "admin") return ADMIN_NAV;
  const allowed = role as AdminRole;
  return ADMIN_NAV.filter((item) => {
    if (!item.roles) return role === "admin";
    return item.roles.includes(allowed);
  });
}
