import {
  BadgeCheck,
  ChefHat,
  MapPin,
  Newspaper,
  Package,
  Percent,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export type QuickMenuLinkTarget = "_self" | "_blank";

export type HomeQuickMenuItem = {
  id: string;
  title: string;
  icon_url: string | null;
  icon_key: string | null;
  link_url: string;
  link_target: QuickMenuLinkTarget;
  alt_text: string | null;
  notes?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const QUICK_MENU_ICON_MAP: Record<string, LucideIcon> = {
  package: Package,
  users: Users,
  "chef-hat": ChefHat,
  "badge-check": BadgeCheck,
  sparkles: Sparkles,
  "map-pin": MapPin,
  percent: Percent,
  newspaper: Newspaper,
};

/** 圖一預設 8 項 — API 失敗或資料庫空白時使用 */
export const DEFAULT_HOME_QUICK_MENU_ITEMS: HomeQuickMenuItem[] = [
  {
    id: "default-shop",
    title: "烘焙材料",
    icon_url: null,
    icon_key: "package",
    link_url: APP_ROUTES.bakingMaterials,
    link_target: "_self",
    alt_text: "烘焙材料",
    sort_order: 10,
    is_active: true,
  },
  {
    id: "default-group-buy",
    title: "團購",
    icon_url: null,
    icon_key: "users",
    link_url: "/group-buy",
    link_target: "_self",
    alt_text: "團購",
    sort_order: 20,
    is_active: true,
  },
  {
    id: "default-recipes",
    title: "食譜影音",
    icon_url: null,
    icon_key: "chef-hat",
    link_url: APP_ROUTES.recipes,
    link_target: "_self",
    alt_text: "食譜影音",
    sort_order: 30,
    is_active: true,
  },
  {
    id: "default-member",
    title: "會員中心",
    icon_url: null,
    icon_key: "badge-check",
    link_url: APP_ROUTES.member,
    link_target: "_self",
    alt_text: "會員中心",
    sort_order: 40,
    is_active: true,
  },
  {
    id: "default-ai",
    title: "AI 助手",
    icon_url: null,
    icon_key: "sparkles",
    link_url: APP_ROUTES.aiTools,
    link_target: "_self",
    alt_text: "AI 助手",
    sort_order: 50,
    is_active: true,
  },
  {
    id: "default-store-map",
    title: "門市地圖",
    icon_url: null,
    icon_key: "map-pin",
    link_url: APP_ROUTES.storeMap,
    link_target: "_self",
    alt_text: "門市地圖",
    sort_order: 60,
    is_active: true,
  },
  {
    id: "default-promo",
    title: "優惠活動",
    icon_url: null,
    icon_key: "percent",
    link_url: "/shop?promo=1",
    link_target: "_self",
    alt_text: "優惠活動",
    sort_order: 70,
    is_active: true,
  },
  {
    id: "default-news",
    title: "最新消息",
    icon_url: null,
    icon_key: "newspaper",
    link_url: APP_ROUTES.news,
    link_target: "_self",
    alt_text: "最新消息",
    sort_order: 80,
    is_active: true,
  },
];

export function normalizeQuickMenuItem(raw: Partial<HomeQuickMenuItem> & { id?: string }): HomeQuickMenuItem {
  const target = raw.link_target === "_blank" ? "_blank" : "_self";
  return {
    id: raw.id ?? `item-${Date.now()}`,
    title: String(raw.title ?? "").trim(),
    icon_url: raw.icon_url?.trim() || null,
    icon_key: raw.icon_key?.trim() || null,
    link_url: String(raw.link_url ?? "").trim(),
    link_target: target,
    alt_text: raw.alt_text?.trim() || null,
    notes: raw.notes?.trim() || null,
    sort_order: Number(raw.sort_order ?? 0),
    is_active: raw.is_active !== false,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export function resolveQuickMenuIcon(item: HomeQuickMenuItem): LucideIcon {
  if (item.icon_key && QUICK_MENU_ICON_MAP[item.icon_key]) {
    return QUICK_MENU_ICON_MAP[item.icon_key];
  }
  const byTitle = DEFAULT_HOME_QUICK_MENU_ITEMS.find((d) => d.title === item.title);
  if (byTitle?.icon_key && QUICK_MENU_ICON_MAP[byTitle.icon_key]) {
    return QUICK_MENU_ICON_MAP[byTitle.icon_key];
  }
  return Package;
}
