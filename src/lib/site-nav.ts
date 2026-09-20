/**
 * Website header menu (single responsive site). Stored in
 * site_settings[key = WEBSITE_NAV_SETTING_KEY] — no schema change.
 */
export type WebsiteNavChild = {
  id: string;
  label: string;
  href: string;
};

export type WebsiteNavItem = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  newTab?: boolean;
  /** Optional one-level dropdown. */
  children?: WebsiteNavChild[];
};

export const WEBSITE_NAV_SETTING_KEY = "website_header_nav";

export const DEFAULT_WEBSITE_NAV: WebsiteNavItem[] = [
  { id: "home", label: "首頁", href: "/", enabled: true },
  { id: "group_buy", label: "團購", href: "/group-buy", enabled: true },
  { id: "shop", label: "商城", href: "/shop", enabled: true },
  { id: "recipes", label: "食譜", href: "/recipes", enabled: true },
  { id: "activities", label: "最新活動", href: "/activities", enabled: true },
  { id: "themes", label: "品牌專區", href: "/themes", enabled: true },
  { id: "ai", label: "AI助手", href: "/ai", enabled: true },
  { id: "stores", label: "門市資訊", href: "/stores", enabled: true },
];

export const WEBSITE_NAV_MAX_ITEMS = 10;

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export function isValidNavHref(href: string) {
  return /^\/(?!\/)/.test(href) || /^https?:\/\//i.test(href);
}

export function newNavId(prefix = "nav") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeWebsiteNav(raw: unknown): WebsiteNavItem[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : null;
  if (!list) return DEFAULT_WEBSITE_NAV;
  const items: WebsiteNavItem[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const label = str(r.label);
    const href = str(r.href);
    if (!label || !href) continue;
    const children = Array.isArray(r.children)
      ? (r.children as unknown[])
          .map((c) => {
            const cr = (c ?? {}) as Record<string, unknown>;
            const cl = str(cr.label);
            const ch = str(cr.href);
            return cl && ch ? { id: str(cr.id) || newNavId("sub"), label: cl, href: ch } : null;
          })
          .filter((c): c is WebsiteNavChild => Boolean(c))
      : [];
    items.push({
      id: str(r.id) || newNavId(),
      label,
      href,
      enabled: r.enabled !== false,
      newTab: r.newTab === true,
      children,
    });
  }
  return items.slice(0, WEBSITE_NAV_MAX_ITEMS);
}
