import type { LucideIcon } from "lucide-react";
import {
  CookingPot,
  Droplets,
  Flame,
  Home,
  Leaf,
  Package,
  Radio,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Tag,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export interface NavLink {
  href: string;
  label: string;
}

export interface HeaderCategoryLink extends NavLink {
  icon: LucideIcon;
  badge?: "live" | "hot";
  match?: (pathname: string, query: string) => boolean;
}

export interface BottomNavItem extends NavLink {
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

function matchCategory(pathname: string, query: string, category: string) {
  if (pathname !== "/products") return false;
  const params = new URLSearchParams(query);
  return params.get("category") === category && !params.get("search");
}

/** Header category chips — scrollable quick filters */
export const HEADER_CATEGORY_LINKS: HeaderCategoryLink[] = [
  {
    label: "首頁",
    href: APP_ROUTES.home,
    icon: Home,
    match: (pathname, query) => pathname === "/" && !query,
  },
  {
    label: "全部商品",
    href: APP_ROUTES.products,
    icon: Package,
    match: (pathname, query) => {
      if (pathname !== "/products") return false;
      const params = new URLSearchParams(query);
      return !params.get("category") && !params.get("search");
    },
  },
  {
    label: "熱門團購",
    href: "/group-buy",
    icon: Flame,
    badge: "hot",
    match: (pathname) => pathname === "/group-buy" || pathname.startsWith("/group-buy/"),
  },
  {
    label: "食品",
    href: "/products?category=食品",
    icon: UtensilsCrossed,
    match: (pathname, query) => matchCategory(pathname, query, "食品"),
  },
  {
    label: "生鮮食材",
    href: "/products?category=生鮮食材",
    icon: Leaf,
    match: (pathname, query) => matchCategory(pathname, query, "生鮮食材"),
  },
  {
    label: "冷凍食品",
    href: "/products?category=冷凍食品",
    icon: Snowflake,
    match: (pathname, query) => matchCategory(pathname, query, "冷凍食品"),
  },
  {
    label: "廚房用品",
    href: "/products?category=廚房用品",
    icon: CookingPot,
    match: (pathname, query) => matchCategory(pathname, query, "廚房用品"),
  },
  {
    label: "居家清潔",
    href: "/products?category=居家清潔",
    icon: Droplets,
    match: (pathname, query) => matchCategory(pathname, query, "居家清潔"),
  },
  {
    label: "季節限定",
    href: "/products?category=季節限定",
    icon: Tag,
    match: (pathname, query) => matchCategory(pathname, query, "季節限定"),
  },
  {
    label: "直播專區",
    href: "/live",
    icon: Radio,
    badge: "live",
    match: (pathname) => pathname === "/live" || pathname.startsWith("/live/"),
  },
];

/** Mobile bottom tab bar (see MobileBottomNav for raised center button) */
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: APP_ROUTES.home, label: "首頁", icon: Home, match: (p) => p === "/" },
  {
    href: "/categories",
    label: "分類",
    icon: Package,
    match: (p) => p.startsWith("/categories") || p.startsWith("/category"),
  },
  {
    href: "/angel",
    label: "餵養",
    icon: Sparkles,
    match: (p) => p.startsWith("/angel") || p.startsWith("/monster"),
  },
  { href: APP_ROUTES.cart, label: "購物車", icon: ShoppingBag, match: (p) => p.startsWith("/cart") },
  { href: APP_ROUTES.profile, label: "我的", icon: User, match: (p) => p.startsWith("/profile") },
];

/** Homepage quick entry cards */
export const HOME_QUICK_ENTRIES = [
  { href: APP_ROUTES.products, label: "全部商品", description: "瀏覽與搜尋商品", emoji: "🛍️" },
  { href: "/group-buy", label: "熱門團購", description: "限時團購與預購", emoji: "🔥" },
  { href: APP_ROUTES.orders, label: "我的團購", description: "查詢訂單與取貨碼", emoji: "📦" },
  { href: APP_ROUTES.profile, label: "會員中心", description: "帳號與個人服務", emoji: "👤" },
] as const;

export interface ProfileMenuGroup {
  title: string;
  items: NavLink[];
}

export const PROFILE_MENU_GROUPS: ProfileMenuGroup[] = [
  {
    title: "帳號設定",
    items: [
      { href: APP_ROUTES.profileEdit, label: "編輯會員資料" },
      { href: APP_ROUTES.profileDelete, label: "刪除帳號" },
    ],
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
      { href: "/commissions", label: "我的分潤" },
      { href: "/share-rewards", label: "分享獎勵" },
      { href: "/notifications", label: "通知中心" },
      { href: "/support", label: "客服中心" },
    ],
  },
  {
    title: "法務資訊",
    items: [
      { href: APP_ROUTES.privacy, label: "隱私權政策" },
      { href: APP_ROUTES.terms, label: "服務條款" },
      { href: APP_ROUTES.accountDeletion, label: "刪除帳號說明" },
    ],
  },
];

export const STAFF_NAV_LINKS: NavLink[] = [
  { href: APP_ROUTES.staffPickupScan, label: "門市掃碼取貨" },
  { href: "/admin/orders", label: "訂單管理" },
];

/** Public footer — no admin / staff tools */
export const FOOTER_SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: "購物",
    links: [
      { href: APP_ROUTES.products, label: "全部商品" },
      { href: "/group-buy", label: "熱門團購" },
      { href: "/live", label: "直播專區" },
      { href: "/videos", label: "影音專區" },
      { href: "/articles", label: "文章專區" },
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
    title: "法務",
    links: [
      { href: APP_ROUTES.privacy, label: "隱私權政策" },
      { href: APP_ROUTES.terms, label: "服務條款" },
      { href: APP_ROUTES.accountDeletion, label: "刪除帳號說明" },
    ],
  },
];

/** Shown in footer only for admin / store_staff */
export const FOOTER_STAFF_SECTION: { title: string; links: NavLink[] } = {
  title: "門市作業",
  links: [
    { href: APP_ROUTES.staffLogin, label: "門市登入" },
    { href: APP_ROUTES.admin, label: "管理後台" },
    { href: APP_ROUTES.staffPickupScan, label: "門市掃碼" },
  ],
};

/** Paths that use minimal chrome (no header category row / bottom nav) */
export function isMinimalChromePath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/auth")
  );
}

export const GROUP_BUY_QUICK_STATS = [
  { label: "今日開團", value: "12", suffix: "團", icon: Sparkles },
  { label: "即將結團", value: "5", suffix: "團", icon: Flame },
  { label: "滿額免運", value: "", suffix: "", icon: Package },
  { label: "邀請好友賺購物金", value: "", suffix: "", icon: Tag },
] as const;
