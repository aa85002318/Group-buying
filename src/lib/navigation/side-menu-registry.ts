import type { SideMenuPrimaryItem, SideMenuSectionKey } from "@/types/navigation";
import { APP_ROUTES } from "@/lib/site-links";
import { FEATURES } from "@/lib/features";
import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";

/** Built-in primary entries for C6 Level 1 (CMS can override order/visibility). */
export const DEFAULT_SIDE_MENU_PRIMARY: SideMenuPrimaryItem[] = [
  {
    id: "home",
    label: "首頁",
    icon: "house",
    route: APP_ROUTES.home,
    section: "home",
    enabled: true,
    order: 10,
  },
  {
    id: "shop",
    label: "商城",
    icon: "shopping-bag",
    route: APP_ROUTES.shop,
    enabled: true,
    order: 20,
  },
  {
    id: "materials",
    label: "商品分類",
    icon: "wheat",
    route: APP_ROUTES.shop,
    section: "materials",
    enabled: true,
    order: 25,
  },
  {
    id: "group_buy",
    label: "團購",
    icon: "gift",
    route: "/group-buy",
    section: "group_buy",
    enabled: GROUP_BUY_CONSUMER_VISIBLE,
    comingSoon: false,
    order: 30,
  },
  {
    id: "recipes",
    label: "食譜影音",
    icon: "book",
    route: APP_ROUTES.recipes,
    section: "recipes",
    enabled: FEATURES.recipes,
    order: 40,
  },
  {
    id: "ai",
    label: "AI烘焙助手",
    icon: "sparkles",
    route: APP_ROUTES.ai,
    enabled: FEATURES.aiAssistant,
    order: 50,
  },
  {
    id: "favorites",
    label: "收藏",
    icon: "heart",
    route: APP_ROUTES.favorites,
    enabled: FEATURES.favorites,
    order: 60,
  },
  {
    id: "member",
    label: "會員中心",
    icon: "user",
    route: APP_ROUTES.member,
    enabled: true,
    order: 70,
  },
  {
    id: "orders",
    label: "我的訂單",
    icon: "clipboard",
    route: APP_ROUTES.memberOrders,
    requiresAuth: true,
    enabled: true,
    order: 80,
  },
  {
    id: "benefits",
    label: "會員禮",
    icon: "gift",
    route: APP_ROUTES.memberBenefits,
    requiresAuth: true,
    enabled: FEATURES.memberBenefits,
    order: 90,
  },
  {
    id: "stores",
    label: "門市資訊",
    icon: "store",
    route: APP_ROUTES.stores,
    enabled: true,
    order: 100,
  },
  {
    id: "news",
    label: "最新消息",
    icon: "newspaper",
    route: APP_ROUTES.news,
    enabled: true,
    order: 110,
  },
  {
    id: "promotions",
    label: "優惠活動",
    icon: "tag",
    route: APP_ROUTES.promotions,
    enabled: true,
    order: 120,
  },
  {
    id: "support",
    label: "客服中心",
    icon: "headphones",
    route: APP_ROUTES.support,
    enabled: true,
    order: 130,
  },
];

export const SIDE_MENU_SECTION_TITLES: Record<
  Exclude<SideMenuSectionKey, "search" | "home" | "member">,
  string
> = {
  materials: "商品分類",
  group_buy: "團購",
  recipes: "食譜",
};

export const RECIPE_QUICK_LINKS: Array<{
  id: string;
  label: string;
  href: string;
  requiresAuth?: boolean;
}> = [
  { id: "all", label: "全部食譜", href: APP_ROUTES.recipes },
  { id: "featured", label: "精選食譜", href: `${APP_ROUTES.recipes}?sort=featured` },
  { id: "latest", label: "最新食譜", href: `${APP_ROUTES.recipes}?sort=latest` },
  { id: "popular", label: "熱門食譜", href: `${APP_ROUTES.recipes}?sort=popular` },
  { id: "ai", label: "AI 找食譜", href: APP_ROUTES.ai },
  {
    id: "favorites",
    label: "收藏食譜",
    href: APP_ROUTES.favorites,
    requiresAuth: true,
  },
];

export const GROUP_BUY_STATUS_LINKS: Array<{ id: string; label: string; href: string }> = [
  { id: "all", label: "全部團購", href: "/group-buy" },
  { id: "active", label: "進行中", href: "/group-buy?status=active" },
  { id: "closing", label: "即將結團", href: "/group-buy?status=closing" },
  { id: "upcoming", label: "即將開團", href: "/group-buy?status=upcoming" },
  { id: "closed", label: "已結團", href: "/group-buy?status=closed" },
];
