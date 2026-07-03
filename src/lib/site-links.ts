import { getSiteUrl } from "@/lib/env";

/** App routes — use relative paths in UI; combine with getSiteUrl() for absolute links. */
export const APP_ROUTES = {
  home: "/",
  register: "/auth/register",
  login: "/auth/login",
  profile: "/profile",
  profileEdit: "/profile/edit",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  admin: "/admin",
  staffLogin: "/staff/login",
  staffPickupScan: "/staff/pickup-scan",
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;

export interface SiteLinkItem {
  key: AppRouteKey;
  label: string;
  href: string;
  absoluteUrl: string;
  description?: string;
}

const LINK_META: Record<AppRouteKey, { label: string; description?: string }> = {
  home: { label: "前台首頁", description: "團購商城首頁" },
  register: { label: "會員註冊", description: "姓名、手機、生日、Email 註冊" },
  login: { label: "會員登入", description: "登入後可下單、查訂單" },
  profile: { label: "會員中心", description: "個人資料與功能選單" },
  profileEdit: { label: "編輯會員資料", description: "更新姓名、手機、生日" },
  products: { label: "商品列表", description: "瀏覽與篩選商品" },
  cart: { label: "購物車", description: "需登入" },
  checkout: { label: "結帳", description: "需登入且完成 Email 驗證" },
  orders: { label: "我的訂單", description: "訂單列表與取貨 QR" },
  admin: { label: "管理後台", description: "admin / store_staff" },
  staffLogin: { label: "門市登入", description: "門市人員專用登入" },
  staffPickupScan: { label: "門市掃碼", description: "取貨掃碼與確認" },
};

/** Primary shortcuts shown in dev panel (matches common test URLs). */
export const PRIMARY_SITE_LINK_KEYS: AppRouteKey[] = [
  "home",
  "register",
  "login",
  "admin",
  "staffPickupScan",
];

export function getSiteLinks(keys: AppRouteKey[] = PRIMARY_SITE_LINK_KEYS): SiteLinkItem[] {
  const base = getSiteUrl();
  return keys.map((key) => {
    const href = APP_ROUTES[key];
    const meta = LINK_META[key];
    return {
      key,
      label: meta.label,
      description: meta.description,
      href,
      absoluteUrl: `${base}${href}`,
    };
  });
}
