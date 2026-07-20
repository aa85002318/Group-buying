export const STORE_STAFF_ADMIN_PATHS = [
  "/admin",
  "/admin/orders",
  "/admin/payments",
  "/admin/pickup",
  "/admin/store",
] as const;

export function isStoreStaffAllowedPath(path: string): boolean {
  return STORE_STAFF_ADMIN_PATHS.some(
    (p) => path === p || (p !== "/admin" && path.startsWith(`${p}/`))
  );
}

export const ADMIN_ONLY_PATHS = [
  "/admin/site-header",
  "/admin/header-promos",
  "/admin/side-menu",
  "/admin/products",
  "/admin/brands",
  "/admin/suppliers",
  "/admin/inventory",
  "/admin/categories",
  "/admin/articles",
  "/admin/recipes",
  "/admin/news",
  "/admin/banners",
  "/admin/home",
  "/admin/benefits",
  "/admin/group-buy",
  "/admin/stores",
  "/admin/faqs",
  "/admin/support-settings",
  "/admin/videos",
  "/admin/livestreams",
  "/admin/notifications",
  "/admin/email-templates",
  "/admin/push",
  "/admin/members",
  "/admin/audit-logs",
  "/admin/share-tracking",
  "/admin/rewards",
  "/admin/commission-rules",
  "/admin/commission-records",
  "/admin/support",
  "/admin/corporate",
  "/admin/courses",
  "/admin/cms",
  "/admin/reports",
  "/admin/staff",
  "/admin/payment-records",
  "/admin/integrations",
] as const;

export type AdminNavItem = {
  href: string;
  label: string;
  roles?: Array<"admin" | "store_staff">;
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
  { href: "/admin/articles", label: "文章管理", roles: ["admin"] },
  { href: "/admin/recipes", label: "食譜管理", roles: ["admin"] },
  { href: "/admin/news", label: "最新資訊", roles: ["admin"] },
  { href: "/admin/banners", label: "Banner 管理", roles: ["admin"] },
  { href: "/admin/home", label: "首頁管理", roles: ["admin"] },
  { href: "/admin/benefits", label: "會員福利", roles: ["admin"] },
  { href: "/admin/group-buy", label: "團購", roles: ["admin"] },
  { href: "/admin/stores", label: "取貨點", roles: ["admin"] },
  { href: "/admin/store", label: "門市管理" },
  { href: "/admin/cms", label: "統一 CMS", roles: ["admin"] },
  { href: "/admin/faqs", label: "FAQ", roles: ["admin"] },
  { href: "/admin/support-settings", label: "客服設定", roles: ["admin"] },
  { href: "/admin/orders", label: "App 訂單" },
  { href: "/admin/payments", label: "付款" },
  { href: "/admin/pickup", label: "取貨" },
  { href: "/admin/payment-records", label: "金流紀錄", roles: ["admin"] },
  { href: "/admin/integrations/ecpay", label: "綠界串接", roles: ["admin"] },
  { href: "/admin/staff", label: "門市人員", roles: ["admin"] },
  { href: "/admin/videos", label: "影音", roles: ["admin"] },
  { href: "/admin/livestreams", label: "直播", roles: ["admin"] },
  { href: "/admin/notifications", label: "通知管理", roles: ["admin"] },
  { href: "/admin/email-templates", label: "郵件版型", roles: ["admin"] },
  { href: "/admin/members", label: "App 會員", roles: ["admin"] },
  { href: "/admin/audit-logs", label: "操作紀錄", roles: ["admin"] },
  { href: "/admin/share-tracking", label: "分享追蹤", roles: ["admin"] },
  { href: "/admin/rewards", label: "獎勵", roles: ["admin"] },
  { href: "/admin/commission-rules", label: "分潤規則", roles: ["admin"] },
  { href: "/admin/commission-records", label: "分潤紀錄", roles: ["admin"] },
  { href: "/admin/support", label: "客服", roles: ["admin"] },
  { href: "/admin/corporate", label: "企業詢價", roles: ["admin"] },
  { href: "/admin/courses", label: "課程", roles: ["admin"] },
  { href: "/admin/reports", label: "報表", roles: ["admin"] },
];

export function navForRole(role: string): AdminNavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "store_staff") {
    return ADMIN_NAV.filter((item) => !item.roles || item.roles.includes("store_staff"));
  }
  return [];
}
