import { APP_ROUTES } from "@/lib/site-links";

export function sideMenuAuthHref(href: string, loggedIn: boolean): string {
  if (loggedIn) return href;
  const needsAuth =
    href.startsWith("/member") ||
    href.startsWith("/profile") ||
    href.startsWith("/orders") ||
    href.startsWith("/account");
  if (!needsAuth) return href;
  return `${APP_ROUTES.login}?next=${encodeURIComponent(href)}`;
}

export const SIDE_MENU_QUICK_ACTIONS = [
  {
    id: "favorites",
    label: "收藏",
    href: APP_ROUTES.memberFavorites,
    requiresAuth: true,
    badgeKey: "favorites" as const,
  },
  {
    id: "orders",
    label: "訂單查詢",
    href: APP_ROUTES.memberOrders,
    requiresAuth: true,
    badgeKey: "orders" as const,
  },
  {
    id: "pickup",
    label: "門市取貨",
    href: APP_ROUTES.memberBarcode,
    requiresAuth: true,
    badgeKey: "pickup" as const,
  },
  {
    id: "support",
    label: "客服中心",
    href: APP_ROUTES.support,
    requiresAuth: false,
    badgeKey: null,
  },
] as const;
