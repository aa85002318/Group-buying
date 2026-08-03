import type { Product } from "@/lib/types/database";

export type GroupBuyHubEvent = {
  id: string;
  title: string;
  end_at?: string | null;
  start_at?: string | null;
  status?: string;
  cover_image?: string | null;
  banner_url?: string | null;
  category_label?: string | null;
  group_buy_products?: Array<{
    special_price?: number | null;
    original_price?: number | null;
    stock?: number | null;
    sold_count?: number | null;
    products?: Product | null;
  }>;
};

export type GroupBuyHubLive = {
  id: string;
  title: string;
  status: "scheduled" | "live" | "ended" | string;
  scheduled_at?: string | null;
  thumbnail_url?: string | null;
  host_name?: string | null;
  theme_label?: string | null;
  featured_on_home?: boolean | null;
  sort_order?: number | null;
};

export const FEATURED_TABS = [
  { id: "all", label: "全部" },
  { id: "snack", label: "零食", match: /零食|點心|snack/i },
  { id: "dessert", label: "甜點", match: /甜點|dessert|蛋糕/i },
  { id: "baking", label: "烘焙", match: /烘焙|baking|材料/i },
  { id: "drink", label: "飲品", match: /飲|drink|茶|咖啡/i },
  { id: "home", label: "居家", match: /居家|家居|home/i },
  { id: "life", label: "生活", match: /生活|life/i },
] as const;

export type FeaturedTabId = (typeof FEATURED_TABS)[number]["id"];

export function primaryProduct(event: GroupBuyHubEvent) {
  return event.group_buy_products?.find((x) => x.products)?.products ?? null;
}

/** Prefer custom CTA → linked product → primary product → group-buy / article page. */
export function eventDetailHref(
  event: GroupBuyHubEvent & {
    link_url?: string | null;
    linked_product_id?: string | null;
    linked_article_slug?: string | null;
  }
) {
  const custom = (event.link_url || "").trim();
  if (custom) return custom;
  const articleSlug = (event.linked_article_slug || "").trim();
  if (articleSlug) return `/articles/${articleSlug}`;
  if (event.linked_product_id) return `/products/${event.linked_product_id}`;
  const product = primaryProduct(event);
  if (product?.id) return `/products/${product.id}`;
  return `/group-buy/${event.id}`;
}

export function primaryGbp(event: GroupBuyHubEvent) {
  return event.group_buy_products?.find((x) => x.products) ?? event.group_buy_products?.[0] ?? null;
}

export function eventImage(event: GroupBuyHubEvent) {
  const product = primaryProduct(event);
  return event.cover_image || event.banner_url || product?.image_url || null;
}

export function eventPrices(event: GroupBuyHubEvent) {
  const gbp = primaryGbp(event);
  const product = gbp?.products;
  const price = Number(gbp?.special_price ?? product?.price ?? 0);
  const original = Number(gbp?.original_price ?? product?.original_price ?? product?.price ?? 0);
  return { price, original };
}

export function soldCount(event: GroupBuyHubEvent) {
  return (event.group_buy_products ?? []).reduce(
    (sum, p) => sum + Number(p.sold_count ?? 0),
    0
  );
}

export function remainParts(endAt?: string | null) {
  if (!endAt) return null;
  const ms = new Date(endAt).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, done: true as const };
  }
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, done: false as const };
}

export function remainDaysLabel(endAt?: string | null) {
  const parts = remainParts(endAt);
  if (!parts) return null;
  if (parts.done) return "已結束";
  if (parts.days > 0) return `${parts.days}天`;
  if (parts.hours > 0) return `${parts.hours}小時`;
  return `${Math.max(1, parts.minutes)}分鐘`;
}

export function matchesFeaturedTab(event: GroupBuyHubEvent, tabId: FeaturedTabId) {
  if (tabId === "all") return true;
  const tab = FEATURED_TABS.find((t) => t.id === tabId);
  if (!tab || !("match" in tab) || !tab.match) return true;
  const hay = `${event.category_label ?? ""} ${event.title ?? ""} ${primaryProduct(event)?.name ?? ""}`;
  return tab.match.test(hay);
}

export function isEndingSoon(endAt?: string | null, withinHours = 72) {
  if (!endAt) return false;
  const ms = new Date(endAt).getTime() - Date.now();
  return ms > 0 && ms <= withinHours * 60 * 60 * 1000;
}

export function isOpenedThisWeek(startAt?: string | null) {
  if (!startAt) return true;
  const d = new Date(startAt);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // week start Sunday; OK for “本週”
  return d >= start;
}
