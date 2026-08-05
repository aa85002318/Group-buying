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
  "/admin/shop",
  "/admin/shop/categories",
  "/admin/shop/features",
  "/admin/shop/promo-banners",
  "/admin/shop/popular-products",
  "/admin/shop/new-products",
  "/admin/shop/inspiration",
  "/admin/shop/recipe-categories",
  "/admin/shop/info-banners",
  "/admin/shop/appearance",
  "/admin/shop/hero-banners",
  "/admin/shop/ai-assistant",
  "/admin/shop/ai-chips",
  "/admin/content",
  "/admin/faqs",
  "/admin/cms",
  "/admin/articles",
  "/admin/livestreams",
  "/admin/stores",
  "/admin/challenges",
  "/admin/themes",
  "/admin/side-menu",
  "/admin/navigation",
  "/admin/settings",
  "/admin/brand-system",
  "/admin/group-buy",
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
  label: string;
  /** Omit for type:"heading" */
  href?: string;
  /** Lucide icon name key — rendered by AdminSidebar */
  icon?: string;
  roles?: AdminRole[];
  badge?: string;
  type?: "item" | "heading";
  /**
   * Keep route + allowlist, but omit from primary sidebar.
   * Reach via CMS Hub (e.g. /admin/shop/* detail pages).
   */
  hiddenFromSidebar?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
  roles?: AdminRole[];
  icon?: string;
};

/**
 * Grouped admin navigation — CHIMEIDIY 管理中心
 * Store ops live under /admin/store/* (no iframe / no second admin).
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "dashboard",
    label: "營運總覽",
    icon: "LayoutDashboard",
    items: [{ href: "/admin", label: "總覽 Dashboard", icon: "LayoutDashboard" }],
  },
  {
    id: "store",
    label: "門市管理",
    icon: "Store",
    roles: ["admin", "store_staff"],
    items: [
      { type: "heading", label: "門市總覽", roles: ["admin", "store_staff"] },
      { href: "/admin/store", label: "今日工作台", roles: ["admin", "store_staff"] },
      { href: "/admin/orders", label: "App 訂單", roles: ["admin", "store_staff"] },
      { href: "/admin/pickup", label: "取貨核銷", roles: ["admin", "store_staff"] },

      {
        href: "/admin/store/pos",
        label: "現場客戶服務",
        roles: ["admin", "store_staff"],
      },

      { type: "heading", label: "商品處理", roles: ["admin", "store_staff"] },
      {
        href: "/admin/store/entry?type=issue_return",
        label: "異常／退貨",
        roles: ["admin", "store_staff"],
      },
      { href: "/admin/store/disposals", label: "商品報廢", roles: ["admin", "store_staff"] },
      {
        href: "/admin/store/entry?type=repair",
        label: "商品報修",
        roles: ["admin", "store_staff"],
      },
      { href: "/admin/store/expiry", label: "效期管理", roles: ["admin", "store_staff"] },

      { type: "heading", label: "分店商品需求／缺貨通知", roles: ["admin", "store_staff"] },
      {
        href: "/admin/store/demand?type=out_of_stock",
        label: "商品缺貨",
        roles: ["admin", "store_staff"],
      },
      {
        href: "/admin/store/demand?type=restock",
        label: "門市商品叫貨需求",
        roles: ["admin", "store_staff"],
      },

      { type: "heading", label: "門市行事曆", roles: ["admin", "store_staff"] },
      {
        href: "/admin/store#calendar",
        label: "待辦／工作紀錄／作廢發票",
        roles: ["admin", "store_staff"],
      },
      {
        href: "/admin/store#messages",
        label: "留言板",
        roles: ["admin", "store_staff"],
      },

      { type: "heading", label: "Excel 批次", roles: ["admin", "store_staff"] },
      {
        href: "/admin/store/excel",
        label: "中文範本／匯入",
        roles: ["admin", "store_staff"],
      },
      {
        href: "/admin/store/excel#export",
        label: "匯出",
        roles: ["admin", "store_staff"],
      },

      { type: "heading", label: "設定", roles: ["admin", "store_staff"] },
      { href: "/admin/products", label: "商品主檔", roles: ["admin", "store_staff"] },
      { href: "/admin/store/suppliers", label: "廠商管理", roles: ["admin", "store_staff"] },
      { href: "/admin/products/labels", label: "價格牌列印", roles: ["admin", "store_staff"] },
      {
        href: "/admin/store/entry",
        label: "現場輸入（異常／報廢等）",
        roles: ["admin", "store_staff"],
      },
      { href: "/admin/store/backups", label: "備份管理", roles: ["admin", "store_staff"] },
    ],
  },
  {
    id: "group-buy",
    label: "團購管理",
    icon: "ShoppingBag",
    roles: ["admin"],
    items: [
      { href: "/admin/articles?category=latest-group-buy", label: "團購活動", roles: ["admin"] },
      { href: "/admin/products", label: "團購商品", roles: ["admin"] },
      { href: "/admin/group-buy/settings", label: "團購頁面設定", roles: ["admin"] },
      { href: "/admin/group-buy/categories", label: "團購分類", roles: ["admin"] },
      { href: "/admin/orders?type=group_buy", label: "團購訂單", roles: ["admin"] },
      { href: "/admin/pickup", label: "取貨核銷", roles: ["admin"] },
      { href: "/admin/commission-rules", label: "團主與分潤", roles: ["admin"] },
      { href: "/admin/header-promos", label: "優惠設定", roles: ["admin"] },
    ],
  },
  {
    id: "orders",
    label: "訂單與取貨",
    icon: "Package",
    roles: ["admin", "store_staff", "customer_service"],
    items: [
      { href: "/admin/orders", label: "App 訂單", roles: ["admin", "store_staff", "customer_service"] },
      { href: "/admin/payments", label: "付款", roles: ["admin", "store_staff"] },
      { href: "/admin/pickup", label: "取貨", roles: ["admin", "store_staff"] },
      { href: "/admin/payment-records", label: "金流紀錄", roles: ["admin"] },
      { href: "/admin/integrations/ecpay", label: "綠界串接", roles: ["admin"] },
      { href: "/admin/stores", label: "門市／取貨點", roles: ["admin"] },
      { href: "/admin/corporate", label: "企業詢價", roles: ["admin"] },
    ],
  },
  {
    id: "members",
    label: "會員管理",
    icon: "Users",
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
    icon: "BookOpen",
    roles: ["admin", "content_editor"],
    items: [
      { href: "/admin/recipes", label: "食譜管理", roles: ["admin", "content_editor"] },
      { href: "/admin/challenges", label: "食譜挑戰", roles: ["admin", "content_editor"] },
    ],
  },
  {
    id: "frontend-cms",
    label: "前台內容管理",
    icon: "LayoutTemplate",
    roles: ["admin", "content_editor"],
    items: [
      { href: "/admin/home", label: "首頁 CMS", roles: ["admin", "content_editor"] },
      { href: "/admin/shop", label: "商城 CMS", roles: ["admin", "content_editor"] },
      { href: "/admin/group-buy/settings", label: "團購頁 CMS", roles: ["admin"] },
      { href: "/admin/side-menu", label: "全站側選單", roles: ["admin", "content_editor"] },
      { href: "/admin/banners", label: "共用 Banner", roles: ["admin", "content_editor"] },
      { href: "/admin/home/preview", label: "首頁預覽", roles: ["admin", "content_editor"] },
      { href: "/admin/content/popups", label: "彈跳公告", roles: ["admin", "content_editor"] },

      /* Shop detail routes — reachable from /admin/shop hub, not primary sidebar */
      {
        href: "/admin/shop/categories",
        label: "商城主分類",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/features",
        label: "商城特色區塊",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/promo-banners",
        label: "商城活動 Banner",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/popular-products",
        label: "商城熱門商品",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/new-products",
        label: "商城新品上架",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/inspiration",
        label: "烘焙靈感牆",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/recipe-categories",
        label: "商城食譜分類",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/info-banners",
        label: "訂購／企業 Banner",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/appearance",
        label: "商城頁首外觀",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/hero-banners",
        label: "商城 Hero Banner",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/ai-assistant",
        label: "AI 食譜助手",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/shop/ai-chips",
        label: "AI 推薦 Chip",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
      {
        href: "/admin/navigation",
        label: "導覽列與選單",
        roles: ["admin", "content_editor"],
        hiddenFromSidebar: true,
      },
    ],
  },
  {
    id: "content",
    label: "內容管理",
    icon: "Newspaper",
    roles: ["admin", "content_editor", "customer_service"],
    items: [
      { href: "/admin/news", label: "公告／最新資訊", roles: ["admin", "content_editor"] },
      { href: "/admin/articles", label: "文章管理", roles: ["admin", "content_editor"] },
      { href: "/admin/articles/categories", label: "文章分類", roles: ["admin", "content_editor"] },
      { href: "/admin/articles?category=latest-group-buy", label: "團購活動（文章）", roles: ["admin", "content_editor"] },
      { href: "/admin/videos", label: "影音", roles: ["admin", "content_editor"] },
      { href: "/admin/livestreams", label: "直播", roles: ["admin", "content_editor"] },
      { href: "/admin/themes", label: "季節主題", roles: ["admin", "content_editor"] },
      { href: "/admin/faqs", label: "FAQ", roles: ["admin", "content_editor", "customer_service"] },
      { href: "/admin/side-menu", label: "側邊選單", roles: ["admin", "content_editor"] },
      { href: "/admin/courses", label: "課程", roles: ["admin"] },
      { href: "/admin/home/recipe-kits", label: "材料包", roles: ["admin", "content_editor"] },
      { href: "/admin/settings/branding", label: "品牌設定", roles: ["admin", "content_editor"] },
    ],
  },
  {
    id: "catalog",
    label: "商品主檔",
    icon: "Boxes",
    roles: ["admin"],
    items: [
      { href: "/admin/products", label: "商品總覽", roles: ["admin"] },
      { href: "/admin/baking-materials", label: "烘焙材料", roles: ["admin"] },
      { href: "/admin/products/analysis", label: "商品分析", roles: ["admin"] },
      { href: "/admin/categories", label: "商品分類", roles: ["admin"] },
      { href: "/admin/brands", label: "品牌管理", roles: ["admin"] },
      { href: "/admin/suppliers", label: "供應商", roles: ["admin"] },
      { href: "/admin/products/tags", label: "商品標籤", roles: ["admin"] },
      { href: "/admin/products/labels", label: "價格牌列印", roles: ["admin", "store_staff"] },
      { href: "/admin/inventory", label: "庫存（舊入口）", roles: ["admin"] },
      { href: "/admin/product-imports", label: "批次匯入", roles: ["admin"] },
    ],
  },
  {
    id: "system",
    label: "系統管理",
    icon: "Settings",
    roles: ["admin"],
    items: [
      { href: "/admin/staff", label: "帳號與權限", roles: ["admin"] },
      { href: "/admin/stores", label: "分店資訊", roles: ["admin"] },
      { href: "/admin/settings/branding", label: "品牌設定", roles: ["admin"] },
      { href: "/admin/store/backups", label: "Google Drive 備份", roles: ["admin"] },
      { href: "/admin/email-templates", label: "系統設定／郵件", roles: ["admin"] },
      { href: "/admin/audit-logs", label: "操作紀錄", roles: ["admin"] },
      { href: "/admin/share-tracking", label: "分享追蹤", roles: ["admin"] },
      { href: "/admin/reports", label: "報表", roles: ["admin"] },
    ],
  },
];

function isLinkItem(item: AdminNavItem): item is AdminNavItem & { href: string } {
  return item.type !== "heading" && typeof item.href === "string" && item.href.length > 0;
}

/** Flat nav derived from groups — kept for backward compatibility */
export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items)
  .filter(isLinkItem)
  .filter(
    (item, index, arr) =>
      arr.findIndex((i) => i.href === item.href && i.label === item.label) === index
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

/** Sidebar-facing groups: role filter + hide detail routes marked hiddenFromSidebar. */
export function navGroupsForRole(role: string): AdminNavGroup[] {
  const source = role === "admin" ? ADMIN_NAV_GROUPS : ADMIN_NAV_GROUPS;

  return source
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.hiddenFromSidebar) return false;
        if (role === "admin") return true;
        return itemVisibleForRole(item, role);
      }),
    }))
    .filter((group) => {
      if (role === "admin") return true;
      return groupVisibleForRole(group, role) && group.items.some((i) => i.type !== "heading");
    })
    .map((group) => {
      // Drop orphan headings (no following link items before next heading / end)
      const cleaned: AdminNavItem[] = [];
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i]!;
        if (item.type === "heading") {
          const hasChild = group.items
            .slice(i + 1)
            .some((next) => next.type !== "heading" && itemVisibleForRole(next, role === "admin" ? "admin" : role));
          // Simpler: heading kept if any subsequent non-heading before next heading
          let hasLink = false;
          for (let j = i + 1; j < group.items.length; j++) {
            const n = group.items[j]!;
            if (n.type === "heading") break;
            hasLink = true;
            break;
          }
          if (hasLink) cleaned.push(item);
          void hasChild;
        } else {
          cleaned.push(item);
        }
      }
      return { ...group, items: cleaned };
    })
    .filter((group) => group.items.length > 0);
}

export function navForRole(role: string): AdminNavItem[] {
  return navGroupsForRole(role).flatMap((g) => g.items).filter(isLinkItem);
}

export function isAdminNavLinkItem(
  item: AdminNavItem
): item is AdminNavItem & { href: string } {
  return isLinkItem(item);
}
