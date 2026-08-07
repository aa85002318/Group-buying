import type { SideMenuPrimaryItem, SideMenuSectionKey } from "@/types/navigation";
import { APP_ROUTES } from "@/lib/site-links";
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
    id: "materials",
    label: "烘焙材料",
    icon: "wheat",
    route: APP_ROUTES.shop,
    section: "materials",
    enabled: true,
    order: 20,
  },
  {
    id: "group_buy",
    label: "團購",
    icon: "gift",
    route: "/group-buy",
    section: "group_buy",
    enabled: true,
    comingSoon: !GROUP_BUY_CONSUMER_VISIBLE,
    order: 30,
  },
  {
    id: "recipes",
    label: "食譜",
    icon: "book",
    route: APP_ROUTES.recipes,
    section: "recipes",
    enabled: true,
    order: 40,
  },
];

export const SIDE_MENU_SECTION_TITLES: Record<
  Exclude<SideMenuSectionKey, "search" | "home" | "member">,
  string
> = {
  materials: "烘焙材料",
  group_buy: "團購",
  recipes: "食譜",
};

export const RECIPE_QUICK_LINKS: Array<{
  id: string;
  label: string;
  href: string;
  requiresAuth?: boolean;
}> = [
  { id: "all", label: "全部食譜", href: "/recipes" },
  { id: "featured", label: "精選食譜", href: "/recipes?sort=featured" },
  { id: "latest", label: "最新食譜", href: "/recipes?sort=latest" },
  { id: "popular", label: "熱門食譜", href: "/recipes?sort=popular" },
  { id: "ai", label: "AI 找食譜", href: "/ai-tools" },
  {
    id: "favorites",
    label: "收藏食譜",
    href: "/member/favorites",
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
