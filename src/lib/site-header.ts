export type HeaderNavBadge = "hot" | "live";

export type HeaderNavItem = {
  id: string;
  label: string;
  href: string;
  badge?: HeaderNavBadge;
  icon_emoji?: string;
};

export const DEFAULT_HEADER_NAV_ITEMS: HeaderNavItem[] = [
  { id: "products", label: "全部商品", href: "/products", icon_emoji: "🛍️" },
  { id: "group_buy", label: "熱門團購", href: "/group-buy", badge: "hot", icon_emoji: "🔥" },
  { id: "live", label: "直播專區", href: "/live", badge: "live", icon_emoji: "📡" },
  { id: "videos", label: "影音專區", href: "/videos", icon_emoji: "🎬" },
  { id: "articles", label: "文章專區", href: "/articles", icon_emoji: "📝" },
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
