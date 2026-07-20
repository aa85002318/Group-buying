/**
 * CHIMEIDIY Consumer Hub 1.0 — types & service registry
 * No DB migration required; types reserved for later wiring.
 */

export type ServiceHubId =
  | "shop"
  | "recipes"
  | "member"
  | "groupBuy"
  | "news"
  | "support"
  | "aiTools"
  | "storeMap";

export type ServiceHubTone =
  | "primary"
  | "groupBuy"
  | "warning"
  | "success"
  | "info"
  | "surface";

export interface ServiceHubItem {
  id: ServiceHubId;
  title: string;
  description: string;
  href: string;
  tone: ServiceHubTone;
  icon: ServiceHubIconName;
}

export type ServiceHubIconName =
  | "package"
  | "chefHat"
  | "badge"
  | "users"
  | "newspaper"
  | "headphones"
  | "sparkles"
  | "mapPin";

export interface RecipeSummary {
  id: string;
  title: string;
  coverImage: string | null;
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  category: string;
  hasVideo: boolean;
  href: string;
}

export interface VideoSummary {
  id: string;
  title: string;
  coverImage: string | null;
  durationLabel: string;
  href: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl: string | null;
  pinned?: boolean;
  important?: boolean;
  href: string;
}

export type NewsCategory =
  | "all"
  | "new"
  | "campaign"
  | "store"
  | "course"
  | "live"
  | "closure"
  | "system";

export interface MemberBenefit {
  id: string;
  title: string;
  description: string;
  status: "announced" | "issued" | "coming_soon";
}

export interface SocialChannel {
  id: string;
  label: string;
  href: string;
  description: string;
  external: boolean;
}

export interface AITool {
  id: "pick-product" | "pantry-recipes";
  title: string;
  description: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  reason: string;
  notes?: string;
  productIds?: string[];
  href?: string;
}

export interface StoreZone {
  code: string;
  name: string;
  hint?: string;
}

export interface StoreShelf {
  zoneCode: string;
  aisle?: string;
  shelf?: string;
  level?: string;
}

export interface ProductLocation {
  productId: string;
  productName: string;
  sku?: string;
  barcode?: string;
  zoneCode: string;
  aisle?: string;
  shelf?: string;
  level?: string;
  description?: string;
}

/** Eight consumer hub entries */
export const SERVICE_HUB_ITEMS: ServiceHubItem[] = [
  {
    id: "shop",
    title: "烘焙材料",
    description: "原料、器具、包裝一次購足",
    href: "/shop",
    tone: "primary",
    icon: "package",
  },
  {
    id: "recipes",
    title: "食譜影音",
    description: "食譜教學與短影音",
    href: "/recipes",
    tone: "warning",
    icon: "chefHat",
  },
  {
    id: "member",
    title: "門市會員",
    description: "會員條碼、載具與會員福利",
    href: "/member",
    tone: "success",
    icon: "badge",
  },
  {
    id: "groupBuy",
    title: "團購專區",
    description: "限時開團與即將收單",
    href: "/group-buy",
    tone: "groupBuy",
    icon: "users",
  },
  {
    id: "news",
    title: "最新資訊",
    description: "新品、活動、課程與公告",
    href: "/news",
    tone: "info",
    icon: "newspaper",
  },
  {
    id: "support",
    title: "門市客服",
    description: "Facebook、Instagram、電話與 LINE",
    href: "/support",
    tone: "surface",
    icon: "headphones",
  },
  {
    id: "aiTools",
    title: "AI 烘焙助手",
    description: "選產品、找食譜、用現有材料做甜點",
    href: "/ai-tools",
    tone: "primary",
    icon: "sparkles",
  },
  {
    id: "storeMap",
    title: "門市地圖",
    description: "查詢商品擺放區域與位置",
    href: "/store-map",
    tone: "success",
    icon: "mapPin",
  },
];

/** Desktop secondary nav (subset of hub) */
export const CONSUMER_SECONDARY_NAV = [
  { href: "/shop", label: "烘焙材料" },
  { href: "/recipes", label: "食譜影音" },
  { href: "/member", label: "門市會員" },
  { href: "/group-buy", label: "團購", accent: "groupBuy" as const },
  { href: "/ai-tools", label: "AI 工具" },
  { href: "/store-map", label: "門市地圖" },
] as const;

/** Mobile bottom nav — 5 items */
export const CONSUMER_BOTTOM_NAV = [
  { href: "/", label: "首頁", match: (p: string) => p === "/", accent: "primary" as const },
  {
    href: "/shop",
    label: "商城",
    match: (p: string) => p.startsWith("/shop") || p.startsWith("/products") || p.startsWith("/categories"),
    accent: "primary" as const,
  },
  {
    href: "/group-buy",
    label: "團購",
    match: (p: string) => p.startsWith("/group-buy"),
    accent: "groupBuy" as const,
  },
  {
    href: "/ai-tools",
    label: "AI 助手",
    match: (p: string) => p.startsWith("/ai-tools") || p.startsWith("/ai"),
    accent: "primary" as const,
  },
  {
    href: "/member",
    label: "我的",
    match: (p: string) => p.startsWith("/member") || p.startsWith("/profile"),
    accent: "primary" as const,
  },
] as const;

export const TONE_CARD_CLASS: Record<ServiceHubTone, string> = {
  primary: "bg-primary-soft",
  groupBuy: "bg-groupBuy-soft",
  warning: "bg-warning-soft",
  success: "bg-success-soft",
  info: "bg-info-soft",
  surface: "bg-surface-soft",
};

export const TONE_ICON_CLASS: Record<ServiceHubTone, string> = {
  primary: "text-primary",
  groupBuy: "text-groupBuy",
  warning: "text-foreground",
  success: "text-success",
  info: "text-info",
  surface: "text-primary",
};
