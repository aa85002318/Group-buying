import { canonicalizeAppHref } from "@/lib/site-links";
import { DEFAULT_SIDE_MENU_PRIMARY } from "@/lib/navigation/side-menu-registry";
import type { SideMenuPrimaryItem } from "@/types/navigation";

export type HeaderNavBadge = "hot" | "live";

export type HeaderNavItem = {
  id: string;
  label: string;
  href: string;
  badge?: HeaderNavBadge;
  icon_emoji?: string;
};

export type HeaderPromoItem = {
  id: string;
  label: string;
  value?: string;
  suffix?: string;
  icon_emoji?: string;
  href?: string;
  font_size?: HeaderPromoFontSize;
};

export type HeaderPromoFontSize = "small" | "medium" | "large";

export type SideMenuIconKey =
  | "flame"
  | "package"
  | "clock"
  | "star"
  | "shopping-bag"
  | "radio"
  | "play"
  | "video"
  | "article"
  | "sparkles"
  | "gift"
  | "house"
  | "wheat"
  | "book"
  | "heart"
  | "user"
  | "clipboard"
  | "store"
  | "newspaper"
  | "tag"
  | "headphones";

export type SideMenuColorKey =
  | "berry"
  | "coral"
  | "orange"
  | "yellow"
  | "purple"
  | "blue"
  | "green"
  | "teal"
  | "pink";

export type SideMenuNavSection =
  | "home"
  | "materials"
  | "group_buy"
  | "recipes"
  | "member"
  | "search";

export type SideMenuItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: SideMenuIconKey;
  color: SideMenuColorKey;
  /** C6 primary section mapping */
  section?: SideMenuNavSection;
  requiresAuth?: boolean;
  comingSoon?: boolean;
  enabled?: boolean;
  order?: number;
};

export type SideMenuSection = {
  id: string;
  title: string;
  icon: SideMenuIconKey;
  color: SideMenuColorKey;
  kind: "links" | "categories";
  items: SideMenuItem[];
};

export const DEFAULT_HEADER_NAV_ITEMS: HeaderNavItem[] = [
  { id: "shop", label: "烘焙材料", href: "/shop", icon_emoji: "🛍️" },
  { id: "recipes", label: "食譜影音", href: "/recipes", icon_emoji: "🎬" },
  { id: "member", label: "門市會員", href: "/member", icon_emoji: "👤" },
  { id: "ai", label: "AI烘焙助手", href: "/ai", icon_emoji: "✨" },
  {
    id: "promo",
    label: "優惠活動",
    href: "/articles?category=%E5%84%AA%E6%83%A0%E6%B4%BB%E5%8B%95",
    icon_emoji: "🏷️",
  },
  {
    id: "news",
    label: "最新消息",
    href: "/articles?category=%E6%9C%80%E6%96%B0%E6%B6%88%E6%81%AF",
    icon_emoji: "📰",
  },
];

export const DEFAULT_HEADER_PROMO_ITEMS: HeaderPromoItem[] = [
  {
    id: "today",
    label: "今日開團",
    value: "12",
    suffix: "團",
    icon_emoji: "✨",
    font_size: "medium",
  },
  {
    id: "ending",
    label: "即將結團",
    value: "5",
    suffix: "團",
    icon_emoji: "🔥",
    font_size: "medium",
  },
  { id: "shipping", label: "滿額免運", icon_emoji: "📦", font_size: "medium" },
  {
    id: "invite",
    label: "邀請好友賺購物金",
    icon_emoji: "🏷️",
    href: "/share-rewards",
    font_size: "medium",
  },
];

const SIDE_MENU_ITEM_META: Record<
  string,
  { description: string; color: SideMenuColorKey }
> = {
  home: { description: "回到首頁", color: "berry" },
  shop: { description: "烘焙材料與商品", color: "pink" },
  materials: { description: "展開烘焙材料分類", color: "orange" },
  group_buy: { description: "限時開團與收單", color: "orange" },
  recipes: { description: "食譜教學與短影音", color: "yellow" },
  ai: { description: "選品與食材食譜", color: "pink" },
  favorites: { description: "收藏商品與食譜", color: "coral" },
  member: { description: "條碼、載具與福利", color: "green" },
  orders: { description: "訂單狀態與取貨", color: "berry" },
  benefits: { description: "會員禮、滿額贈與兌換券", color: "yellow" },
  stores: { description: "地址與營業時間", color: "green" },
  news: { description: "文章分類：最新消息", color: "blue" },
  promotions: { description: "文章分類：優惠活動", color: "orange" },
  support: { description: "LINE、社群與表單", color: "blue" },
};

const PRIMARY_ICON_KEYS = new Set<string>([
  "flame",
  "package",
  "clock",
  "star",
  "shopping-bag",
  "radio",
  "play",
  "video",
  "article",
  "sparkles",
  "gift",
  "house",
  "wheat",
  "book",
  "heart",
  "user",
  "clipboard",
  "store",
  "newspaper",
  "tag",
  "headphones",
]);

function asSideMenuIcon(icon?: string): SideMenuIconKey {
  return PRIMARY_ICON_KEYS.has(icon ?? "") ? (icon as SideMenuIconKey) : "sparkles";
}

/** Consumer hamburger entries — kept in sync with DEFAULT_SIDE_MENU_PRIMARY. */
export const DEFAULT_SIDE_MENU_SECTIONS: SideMenuSection[] = [
  {
    id: "primary",
    title: "主要入口",
    icon: "sparkles",
    color: "berry",
    kind: "links",
    items: DEFAULT_SIDE_MENU_PRIMARY.map((item) => {
      const meta = SIDE_MENU_ITEM_META[item.id];
      return {
        id: item.id,
        label: item.label,
        description: meta?.description,
        href: item.route ?? "/",
        icon: asSideMenuIcon(item.icon),
        color: meta?.color ?? "berry",
        section: item.section,
        requiresAuth: item.requiresAuth,
        comingSoon: item.comingSoon,
        enabled: item.enabled,
        order: item.order,
      };
    }),
  },
];

export function sideMenuSectionsToPrimaryItems(
  sections: SideMenuSection[]
): SideMenuPrimaryItem[] {
  const items: SideMenuPrimaryItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      items.push({
        id: item.id,
        label: item.label,
        icon: item.icon,
        route: item.href,
        section: item.section,
        requiresAuth: item.requiresAuth,
        enabled: item.enabled !== false,
        comingSoon: item.comingSoon,
        order: item.order ?? items.length + 1,
      });
    }
  }
  return items.sort((a, b) => a.order - b.order);
}

export function isValidHeaderHref(href: string): boolean {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeHeaderNavItems(raw: unknown): HeaderNavItem[] {
  if (!Array.isArray(raw)) return [];

  const items: HeaderNavItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const href = typeof record.href === "string" ? record.href.trim() : "";
    if (!label || !isValidHeaderHref(href)) continue;

    const id =
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : `nav-${items.length + 1}`;
    const badge =
      record.badge === "hot" || record.badge === "live" ? record.badge : undefined;
    const icon_emoji =
      typeof record.icon_emoji === "string" && record.icon_emoji.trim()
        ? record.icon_emoji.trim()
        : undefined;

    items.push({ id, label, href: canonicalizeAppHref(href), badge, icon_emoji });
  }
  return items;
}

export function normalizeHeaderPromoItems(raw: unknown): HeaderPromoItem[] {
  if (!Array.isArray(raw)) return [];

  const items: HeaderPromoItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    if (!label) continue;

    const id =
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : `promo-${items.length + 1}`;
    const value =
      typeof record.value === "string" && record.value.trim()
        ? record.value.trim()
        : undefined;
    const suffix =
      typeof record.suffix === "string" && record.suffix.trim()
        ? record.suffix.trim()
        : undefined;
    const icon_emoji =
      typeof record.icon_emoji === "string" && record.icon_emoji.trim()
        ? record.icon_emoji.trim()
        : undefined;
    const href =
      typeof record.href === "string" && isValidHeaderHref(record.href)
        ? canonicalizeAppHref(record.href.trim())
        : undefined;
    const font_size =
      record.font_size === "small" ||
      record.font_size === "medium" ||
      record.font_size === "large"
        ? record.font_size
        : "medium";

    items.push({ id, label, value, suffix, icon_emoji, href, font_size });
  }
  return items;
}

const SIDE_MENU_ICONS = new Set<SideMenuIconKey>([
  "flame",
  "package",
  "clock",
  "star",
  "shopping-bag",
  "radio",
  "play",
  "video",
  "article",
  "sparkles",
  "gift",
  "house",
  "wheat",
  "book",
  "heart",
  "user",
  "clipboard",
  "store",
  "newspaper",
  "tag",
  "headphones",
]);

const SIDE_MENU_COLORS = new Set<SideMenuColorKey>([
  "berry",
  "coral",
  "orange",
  "yellow",
  "purple",
  "blue",
  "green",
  "teal",
  "pink",
]);

export function normalizeSideMenuSections(raw: unknown): SideMenuSection[] {
  if (!Array.isArray(raw)) return [];

  const sections: SideMenuSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title || !Array.isArray(record.items)) continue;

    const items: SideMenuItem[] = [];
    for (const itemRow of record.items) {
      if (!itemRow || typeof itemRow !== "object") continue;
      const item = itemRow as Record<string, unknown>;
      const label = typeof item.label === "string" ? item.label.trim() : "";
      const href = typeof item.href === "string" ? item.href.trim() : "";
      if (!label || !isValidHeaderHref(href)) continue;

      const sectionRaw =
        typeof item.section === "string" ? item.section.trim() : "";
      const sectionOk = [
        "home",
        "materials",
        "group_buy",
        "recipes",
        "member",
        "search",
      ].includes(sectionRaw);

      items.push({
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id.trim()
            : `side-item-${items.length + 1}`,
        label,
        description:
          typeof item.description === "string" && item.description.trim()
            ? item.description.trim()
            : undefined,
        href: canonicalizeAppHref(href),
        icon: SIDE_MENU_ICONS.has(item.icon as SideMenuIconKey)
          ? (item.icon as SideMenuIconKey)
          : "sparkles",
        color: SIDE_MENU_COLORS.has(item.color as SideMenuColorKey)
          ? (item.color as SideMenuColorKey)
          : "berry",
        section: sectionOk ? (sectionRaw as SideMenuNavSection) : undefined,
        requiresAuth: item.requiresAuth === true || item.requires_auth === true,
        comingSoon: item.comingSoon === true || item.coming_soon === true,
        enabled: item.enabled === false ? false : true,
        order:
          typeof item.order === "number" && Number.isFinite(item.order)
            ? item.order
            : items.length + 1,
      });
    }

    sections.push({
      id:
        typeof record.id === "string" && record.id.trim()
          ? record.id.trim()
          : `side-section-${sections.length + 1}`,
      title,
      icon: SIDE_MENU_ICONS.has(record.icon as SideMenuIconKey)
        ? (record.icon as SideMenuIconKey)
        : "sparkles",
      color: SIDE_MENU_COLORS.has(record.color as SideMenuColorKey)
        ? (record.color as SideMenuColorKey)
        : "berry",
      kind: record.kind === "categories" ? "categories" : "links",
      items,
    });
  }

  return sections;
}
