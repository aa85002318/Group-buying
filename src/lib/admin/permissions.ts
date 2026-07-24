export type AdminRole = "admin" | "store_staff" | "content_editor" | "customer_service";

export const STORE_STAFF_ADMIN_PATHS = [
  "/admin",
  "/admin/orders",
  "/admin/payments",
  "/admin/pickup",
  "/admin/store",
  "/admin/payment-records",
  "/admin/suppliers",
  "/admin/categories",
  "/admin/products",
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
  "/admin/livestreams",
  "/admin/stores",
  "/admin/challenges",
  "/admin/themes",
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

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
  roles?: AdminRole[];
};

/**
 * Grouped admin navigation — CHIMEIDIY 管理中心
 * Store ops live under /admin/store/* (no iframe / no second admin).
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "dashboard",
    label: "營運總覽",
    items: [{ href: "/admin", label: "總覽 Dashboard" }],
  },
  {
    id: "store",
    label: "門市管理",
    roles: ["admin", "store_staff"],
    items: [
      { href: "/admin/store", label: "門市總覽", roles: ["admin", "store_staff"] },
      { href: "/admin/store/products", label: "商品資料庫", roles: ["admin", "store_staff"] },
      { href: "/admin/store/inventory", label: "庫存管理", roles: ["admin", "store_staff"] },
      { href: "/admin/store/expiry", label: "效期管理", roles: ["admin", "store_staff"] },
      { href: "/admin/store/disposals", label: "報廢管理", roles: ["admin", "store_staff"] },
      { href: "/admin/store/issues", label: "異常登記", roles: ["admin", "store_staff"] },
      { href: "/admin/store/returns", label: "退貨管理", roles: ["admin", "store_staff"] },
      { href: "/admin/store/batch", label: "批次登記", roles: ["admin", "store_staff"] },
      { href: "/admin/store/suppliers", label: "廠商管理", roles: ["admin", "store_staff"] },
      { href: "/admin/store/categories", label: "商品分類", roles: ["admin", "store_staff"] },
      { href: "/admin/store/backups", label: "備份管理", roles: ["admin", "store_staff"] },
    ],
  },
  {
    id: "group-buy",
    label: "團購管理",
    roles: ["admin"],
    items: [
      { href: "/admin/group-buy", label: "團購活動", roles: ["admin"] },
      { href: "/admin/products", label: "團購商品", roles: ["admin"] },
      { href: "/admin/orders", label: "訂單管理", roles: ["admin"] },
      { href: "/admin/pickup", label: "取貨核銷", roles: ["admin"] },
      { href: "/admin/commission-rules", label: "團主與分潤", roles: ["admin"] },
      { href: "/admin/header-promos", label: "優惠設定", roles: ["admin"] },
    ],
  },
  {
    id: "orders",
    label: "訂單與取貨",
    roles: ["admin", "store_staff", "customer_service"],
    items: [
      { href: "/admin/orders", label: "App 訂單", roles: ["admin", "store_staff", "customer_service"] },
      { href: "/admin/payments", label: "付款", roles: ["admin", "store_staff"] },
      { href: "/admin/pickup", label: "取貨", roles: ["admin", "store_staff"] },
      { href: "/admin/payment-records", label: "金流紀錄", roles: ["admin"] },
      { href: "/admin/integrations/ecpay", label: "綠界串接", roles: ["admin"] },
      { href: "/admin/stores", label: "取貨點", roles: ["admin"] },
      { href: "/admin/corporate", label: "企業詢價", roles: ["admin"] },
    ],
  },
  {
    id: "members",
    label: "會員管理",
    roles: ["admin", "customer_service"],
    items: [
      { href: "/admin/members", label: "會員列表", roles: ["admin", "customer_service"] },
      { href: "/admin/benefits", label: "會員等級／福利", roles: ["admin"] },
      { href: "/admin/rewards", label: "點數紀錄", roles: ["admin"] },
      { href: "/admin/support", label: "客服", roles: ["admin", "customer_service"] },
      { href: "/admin/support-settings", label: "客服設定", roles: ["admin", "customer_service"] },
      { href: "/admin/notifications", label: "通知管理", roles: ["admin", "customer_service"] },
      { href: "/admin/commission-records", label: "分潤紀錄", roles: ["admin"] },
    ],
  },
  {
    id: "recipes",
    label: "食譜中心",
    roles: ["admin", "content_editor"],
    items: [
      { href: "/admin/recipes", label: "食譜管理", roles: ["admin", "content_editor"] },
      { href: "/admin/recipes", label: "Story Builder", roles: ["admin", "content_editor"] },
      { href: "/admin/recipes", label: "食譜提問", roles: ["admin", "content_editor"] },
      { href: "/admin/recipes", label: "成品分享", roles: ["admin", "content_editor"] },
      { href: "/admin/challenges", label: "食譜挑戰", roles: ["admin", "content_editor"] },
    ],
  },
  {
    id: "content",
    label: "內容管理",
    roles: ["admin", "content_editor", "customer_service"],
    items: [
      { href: "/admin/home", label: "首頁設定", roles: ["admin", "content_editor"] },
      { href: "/admin/banners", label: "Banner", roles: ["admin", "content_editor"] },
      { href: "/admin/news", label: "公告／最新資訊", roles: ["admin", "content_editor"] },
      { href: "/admin/articles", label: "文章管理", roles: ["admin", "content_editor"] },
      { href: "/admin/videos", label: "影音", roles: ["admin", "content_editor"] },
      { href: "/admin/livestreams", label: "直播", roles: ["admin", "content_editor"] },
      { href: "/admin/themes", label: "季節主題", roles: ["admin", "content_editor"] },
      { href: "/admin/faqs", label: "FAQ", roles: ["admin", "content_editor", "customer_service"] },
      { href: "/admin/side-menu", label: "側邊選單", roles: ["admin"] },
      { href: "/admin/courses", label: "課程", roles: ["admin"] },
    ],
  },
  {
    id: "catalog",
    label: "商品主檔（進階）",
    roles: ["admin"],
    items: [
      { href: "/admin/products", label: "商品總覽", roles: ["admin"] },
      { href: "/admin/baking-materials", label: "烘焙材料", roles: ["admin"] },
      { href: "/admin/products/analysis", label: "商品分析", roles: ["admin"] },
      { href: "/admin/categories", label: "商品分類", roles: ["admin"] },
      { href: "/admin/brands", label: "品牌管理", roles: ["admin"] },
      { href: "/admin/suppliers", label: "供應商", roles: ["admin"] },
      { href: "/admin/products/tags", label: "商品標籤", roles: ["admin"] },
      { href: "/admin/inventory", label: "庫存（舊入口）", roles: ["admin"] },
      { href: "/admin/product-imports", label: "批次匯入", roles: ["admin"] },
    ],
  },
  {
    id: "system",
    label: "系統管理",
    roles: ["admin"],
    items: [
      { href: "/admin/staff", label: "帳號與權限", roles: ["admin"] },
      { href: "/admin/store/backups", label: "Google Drive 備份", roles: ["admin"] },
      { href: "/admin/email-templates", label: "系統設定／郵件", roles: ["admin"] },
      { href: "/admin/audit-logs", label: "操作紀錄", roles: ["admin"] },
      { href: "/admin/share-tracking", label: "分享追蹤", roles: ["admin"] },
      { href: "/admin/reports", label: "報表", roles: ["admin"] },
    ],
  },
];

/** Flat nav derived from groups — kept for backward compatibility */
export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items).filter(
  (item, index, arr) => arr.findIndex((i) => i.href === item.href && i.label === item.label) === index
);

function itemVisibleForRole(item: AdminNavItem, role: string): boolean {
  if (role === "admin") return true;
  if (!item.roles) return false;
  return item.roles.includes(role as AdminRole);
}

function groupVisibleForRole(group: AdminNavGroup, role: string): boolean {
  if (role === "admin") return true;
  const visibleItems = group.items.filter((item) => itemVisibleForRole(item, role));
  if (visibleItems.length === 0) return false;
  if (!group.roles) return true;
  return group.roles.includes(role as AdminRole);
}

export function navGroupsForRole(role: string): AdminNavGroup[] {
  if (role === "admin") return ADMIN_NAV_GROUPS;
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => itemVisibleForRole(item, role)),
  })).filter((group) => groupVisibleForRole(group, role) && group.items.length > 0);
}

export function navForRole(role: string): AdminNavItem[] {
  return navGroupsForRole(role).flatMap((g) => g.items);
}
