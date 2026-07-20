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
  | "sparkles";

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

export type SideMenuItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: SideMenuIconKey;
  color: SideMenuColorKey;
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
  { id: "group_buy", label: "團購", href: "/group-buy", badge: "hot", icon_emoji: "🔥" },
  { id: "ai", label: "AI 工具", href: "/ai-tools", icon_emoji: "✨" },
  { id: "store_map", label: "門市地圖", href: "/store-map", icon_emoji: "📍" },
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

export const DEFAULT_SIDE_MENU_SECTIONS: SideMenuSection[] = [
  {
    id: "services",
    title: "主要服務",
    icon: "sparkles",
    color: "berry",
    kind: "links",
    items: [
      {
        id: "shop",
        label: "烘焙材料",
        description: "原料、器具、包裝",
        href: "/shop",
        icon: "package",
        color: "berry",
      },
      {
        id: "recipes",
        label: "食譜影音",
        description: "食譜教學與短影音",
        href: "/recipes",
        icon: "article",
        color: "yellow",
      },
      {
        id: "member",
        label: "門市會員",
        description: "條碼、載具與福利",
        href: "/member",
        icon: "star",
        color: "green",
      },
      {
        id: "group_buy",
        label: "團購",
        description: "限時開團與收單",
        href: "/group-buy",
        icon: "flame",
        color: "orange",
      },
      {
        id: "news",
        label: "最新資訊",
        description: "新品活動與公告",
        href: "/news",
        icon: "article",
        color: "blue",
      },
      {
        id: "ai",
        label: "AI 烘焙助手",
        description: "選品與食材食譜",
        href: "/ai-tools",
        icon: "sparkles",
        color: "pink",
      },
      {
        id: "store_map",
        label: "門市地圖",
        description: "商品擺放位置",
        href: "/store-map",
        icon: "package",
        color: "teal",
      },
    ],
  },
  {
    id: "today",
    title: "今日必逛",
    icon: "flame",
    color: "coral",
    kind: "links",
    items: [
      {
        id: "new",
        label: "本日上架",
        description: "今天最新上架商品",
        href: "/products?sort=newest",
        icon: "package",
        color: "berry",
      },
      {
        id: "ending",
        label: "即將收單",
        description: "即將截止下單商品",
        href: "/group-buy",
        icon: "clock",
        color: "orange",
      },
      {
        id: "weekly",
        label: "本週精選",
        description: "本週推薦商品",
        href: "/group-buy",
        icon: "star",
        color: "yellow",
      },
      {
        id: "popular",
        label: "熱門商品",
        description: "最多人購買",
        href: "/shop",
        icon: "flame",
        color: "coral",
      },
    ],
  },
  {
    id: "categories",
    title: "商品分類",
    icon: "shopping-bag",
    color: "pink",
    kind: "categories",
    items: [
      {
        id: "category-trigger",
        label: "瀏覽所有分類",
        description: "點擊展開商品分類",
        href: "/categories",
        icon: "shopping-bag",
        color: "pink",
      },
    ],
  },
  {
    id: "support",
    title: "服務與支援",
    icon: "article",
    color: "blue",
    kind: "links",
    items: [
      {
        id: "support",
        label: "客服中心",
        description: "LINE、社群與表單",
        href: "/support",
        icon: "article",
        color: "blue",
      },
      {
        id: "stores",
        label: "門市資訊",
        description: "地址與營業時間",
        href: "/stores",
        icon: "package",
        color: "green",
      },
      {
        id: "faq",
        label: "常見問題",
        description: "FAQ",
        href: "/faq",
        icon: "article",
        color: "yellow",
      },
      {
        id: "about",
        label: "關於 CHIMEIDIY",
        description: "品牌與烘焙生活平台",
        href: "/corporate",
        icon: "star",
        color: "berry",
      },
    ],
  },
  {
    id: "member",
    title: "會員",
    icon: "star",
    color: "green",
    kind: "links",
    items: [
      {
        id: "orders",
        label: "我的訂單",
        description: "訂單狀態與取貨",
        href: "/orders",
        icon: "package",
        color: "berry",
      },
      {
        id: "favorites",
        label: "我的收藏",
        description: "收藏商品與食譜",
        href: "/member/favorites",
        icon: "star",
        color: "coral",
      },
      {
        id: "carrier",
        label: "發票載具",
        description: "手機條碼載具",
        href: "/member/carrier",
        icon: "article",
        color: "green",
      },
      {
        id: "account",
        label: "帳號設定",
        description: "個人資料與通知",
        href: "/member/settings/account",
        icon: "star",
        color: "blue",
      },
    ],
  },
  {
    id: "content",
    title: "影音內容",
    icon: "video",
    color: "blue",
    kind: "links",
    items: [
      {
        id: "live",
        label: "直播預告",
        description: "播放中的直播與即將開始",
        href: "/live",
        icon: "radio",
        color: "coral",
      },
      {
        id: "replay",
        label: "直播回放",
        description: "所有直播留存影片",
        href: "/videos",
        icon: "play",
        color: "blue",
      },
      {
        id: "tutorial",
        label: "影音教學",
        description: "短影音、一分鐘教學",
        href: "/videos",
        icon: "video",
        color: "blue",
      },
      {
        id: "articles",
        label: "文章專區",
        description: "食譜、開箱、推薦文章",
        href: "/articles",
        icon: "article",
        color: "yellow",
      },
    ],
  },
];

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

    items.push({ id, label, href, badge, icon_emoji });
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
        ? record.href.trim()
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
        href,
        icon: SIDE_MENU_ICONS.has(item.icon as SideMenuIconKey)
          ? (item.icon as SideMenuIconKey)
          : "sparkles",
        color: SIDE_MENU_COLORS.has(item.color as SideMenuColorKey)
          ? (item.color as SideMenuColorKey)
          : "berry",
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
