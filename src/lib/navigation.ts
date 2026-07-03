import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Home,
  Package,
  ShoppingBag,
  User,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export interface NavLink {
  href: string;
  label: string;
}

export interface BottomNavItem extends NavLink {
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

/** Header category chips — scrollable quick filters */
export const HEADER_CATEGORY_LINKS: NavLink[] = [
  { label: "全部商品", href: APP_ROUTES.products },
  { label: "食品", href: "/products?category=食品" },
  { label: "生鮮食材", href: "/products?category=生鮮食材" },
  { label: "冷凍食品", href: "/products?category=冷凍食品" },
  { label: "廚房用品", href: "/products?category=廚房用品" },
  { label: "居家清潔", href: "/products?category=居家清潔" },
  { label: "季節限定", href: "/products?category=季節限定" },
  { label: "團購活動", href: "/group-buy" },
  { label: "直播專區", href: "/live" },
];

/** Mobile bottom tab bar */
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: APP_ROUTES.home, label: "首頁", icon: Home, match: (p) => p === "/" },
  { href: APP_ROUTES.products, label: "商品", icon: Package, match: (p) => p.startsWith("/products") },
  { href: "/group-buy", label: "團購", icon: ShoppingBag, match: (p) => p.startsWith("/group-buy") },
  { href: APP_ROUTES.orders, label: "訂單", icon: ClipboardList, match: (p) => p.startsWith("/orders") },
  { href: APP_ROUTES.profile, label: "我的", icon: User, match: (p) => p.startsWith("/profile") },
];

/** Homepage quick entry cards */
export const HOME_QUICK_ENTRIES = [
  { href: APP_ROUTES.products, label: "全部商品", description: "瀏覽與搜尋商品", emoji: "🛍️" },
  { href: "/group-buy", label: "團購活動", description: "限時團購與預購", emoji: "🏷️" },
  { href: APP_ROUTES.orders, label: "我的訂單", description: "查詢訂單與取貨碼", emoji: "📦" },
  { href: APP_ROUTES.profile, label: "會員中心", description: "帳號與個人服務", emoji: "👤" },
] as const;

export interface ProfileMenuGroup {
  title: string;
  items: NavLink[];
}

export const PROFILE_MENU_GROUPS: ProfileMenuGroup[] = [
  {
    title: "帳號設定",
    items: [{ href: APP_ROUTES.profileEdit, label: "編輯會員資料" }],
  },
  {
    title: "購物與訂單",
    items: [
      { href: APP_ROUTES.products, label: "商品列表" },
      { href: "/cart", label: "購物車" },
      { href: APP_ROUTES.orders, label: "我的訂單" },
    ],
  },
  {
    title: "會員服務",
    items: [
      { href: "/monster", label: "我的麵包小怪獸" },
      { href: "/commissions", label: "我的分潤" },
      { href: "/share-rewards", label: "分享獎勵" },
      { href: "/notifications", label: "通知中心" },
      { href: "/support", label: "客服中心" },
    ],
  },
];

export const STAFF_NAV_LINKS: NavLink[] = [
  { href: APP_ROUTES.staffPickupScan, label: "門市掃碼取貨" },
  { href: "/admin/orders", label: "訂單管理" },
];

export const FOOTER_SECTIONS = [
  {
    title: "購物",
    links: [
      { href: APP_ROUTES.products, label: "全部商品" },
      { href: "/group-buy", label: "團購活動" },
      { href: "/live", label: "直播專區" },
      { href: "/videos", label: "影音專區" },
    ],
  },
  {
    title: "會員",
    links: [
      { href: APP_ROUTES.login, label: "登入" },
      { href: APP_ROUTES.register, label: "註冊" },
      { href: APP_ROUTES.profile, label: "會員中心" },
      { href: APP_ROUTES.orders, label: "我的訂單" },
      { href: "/support", label: "客服中心" },
    ],
  },
  {
    title: "門市與後台",
    links: [
      { href: APP_ROUTES.staffLogin, label: "門市登入" },
      { href: APP_ROUTES.admin, label: "管理後台" },
      { href: APP_ROUTES.staffPickupScan, label: "門市掃碼" },
    ],
  },
] as const;

/** Paths that use minimal chrome (no header category row / bottom nav) */
export function isMinimalChromePath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/auth")
  );
}
