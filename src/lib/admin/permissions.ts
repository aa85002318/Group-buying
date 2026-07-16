export const STORE_STAFF_ADMIN_PATHS = [
  "/admin",
  "/admin/orders",
  "/admin/payments",
  "/admin/pickup",
] as const;

export function isStoreStaffAllowedPath(path: string): boolean {
  return STORE_STAFF_ADMIN_PATHS.some(
    (p) => path === p || (p !== "/admin" && path.startsWith(`${p}/`))
  );
}

export const ADMIN_ONLY_PATHS = [
  "/admin/products",
  "/admin/categories",
  "/admin/articles",
  "/admin/group-buy",
  "/admin/stores",
  "/admin/videos",
  "/admin/livestreams",
  "/admin/notifications",
  "/admin/email-templates",
  "/admin/push",
  "/admin/members",
  "/admin/share-tracking",
  "/admin/rewards",
  "/admin/commission-rules",
  "/admin/commission-records",
  "/admin/support",
  "/admin/reports",
  "/admin/staff",
  "/admin/payment-records",
] as const;

export type AdminNavItem = {
  href: string;
  label: string;
  roles?: Array<"admin" | "store_staff">;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "儀表板" },
  { href: "/admin/products", label: "商品", roles: ["admin"] },
  { href: "/admin/categories", label: "分類管理", roles: ["admin"] },
  { href: "/admin/articles", label: "文章管理", roles: ["admin"] },
  { href: "/admin/group-buy", label: "團購", roles: ["admin"] },
  { href: "/admin/stores", label: "取貨點", roles: ["admin"] },
  { href: "/admin/orders", label: "訂單" },
  { href: "/admin/payments", label: "付款" },
  { href: "/admin/pickup", label: "取貨" },
  { href: "/admin/payment-records", label: "金流紀錄", roles: ["admin"] },
  { href: "/admin/staff", label: "門市人員", roles: ["admin"] },
  { href: "/admin/videos", label: "影音", roles: ["admin"] },
  { href: "/admin/livestreams", label: "直播", roles: ["admin"] },
  { href: "/admin/notifications", label: "推播", roles: ["admin"] },
  { href: "/admin/email-templates", label: "郵件版型", roles: ["admin"] },
  { href: "/admin/members", label: "會員", roles: ["admin"] },
  { href: "/admin/share-tracking", label: "分享追蹤", roles: ["admin"] },
  { href: "/admin/rewards", label: "獎勵", roles: ["admin"] },
  { href: "/admin/commission-rules", label: "分潤規則", roles: ["admin"] },
  { href: "/admin/commission-records", label: "分潤紀錄", roles: ["admin"] },
  { href: "/admin/support", label: "客服", roles: ["admin"] },
  { href: "/admin/reports", label: "報表", roles: ["admin"] },
];

export function navForRole(role: string): AdminNavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "store_staff") {
    return ADMIN_NAV.filter((item) => !item.roles || item.roles.includes("store_staff"));
  }
  return [];
}
