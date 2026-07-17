import type { GroupBuyEvent, Product } from "@/lib/types/database";

export function getStartOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isCreatedThisWeek(createdAt: string): boolean {
  return new Date(createdAt) >= getStartOfWeek();
}

export function isClosingWithinDays(endAt: string, days = 7): boolean {
  const end = new Date(endAt);
  const now = new Date();
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return end > now && end <= limit;
}

export type HomeProduct = Product & {
  href?: string;
  cutoff_at?: string;
  sold_count?: number;
};

type EventWithProducts = GroupBuyEvent & {
  group_buy_products?: Array<{
    special_price?: number | null;
    sold_count?: number;
    products?: Product | null;
  }>;
};

export function getNewThisWeekProducts(products: Product[]): Product[] {
  return products.filter((p) => isCreatedThisWeek(p.created_at));
}

/** 即將收單：優先使用商品 preorder_deadline（7 天內），否則回退團購 end_at */
export function getClosingSoonProducts(
  products: Product[],
  events: EventWithProducts[],
  days = 7
): HomeProduct[] {
  const items: HomeProduct[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    if (!product.is_active || !product.preorder_deadline) continue;
    if (!isClosingWithinDays(product.preorder_deadline, days)) continue;
    seen.add(product.id);
    items.push({
      ...product,
      href: `/products/${product.id}`,
      cutoff_at: product.preorder_deadline,
    });
  }

  for (const event of events) {
    if (event.status !== "active" || !isClosingWithinDays(event.end_at, days)) continue;

    for (const gbp of event.group_buy_products ?? []) {
      const product = gbp.products;
      if (!product || seen.has(product.id)) continue;
      if (product.preorder_deadline) continue;
      seen.add(product.id);
      items.push({
        ...product,
        price: gbp.special_price ?? product.price,
        href: `/group-buy/${event.id}`,
        cutoff_at: event.end_at,
        sold_count: gbp.sold_count,
      });
    }
  }

  return items.sort(
    (a, b) => new Date(a.cutoff_at ?? 0).getTime() - new Date(b.cutoff_at ?? 0).getTime()
  );
}

export function formatCutoffLabel(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now();
  const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  if (hours < 24) return `${hours} 小時內截止`;
  const days = Math.ceil(hours / 24);
  return `${days} 天內截止`;
}

export const CATEGORY_ICONS: Record<string, string> = {
  food: "🍎",
  fresh: "🥬",
  frozen: "❄️",
  kitchen: "🍳",
  cleaning: "🧹",
  seasonal: "🌸",
};

export function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? "🛒";
}

export function getCategoryDisplayIcon(category: {
  slug: string;
  icon_emoji?: string | null;
  icon_url?: string | null;
}): { type: "emoji"; value: string } | { type: "image"; value: string } {
  if (category.icon_url) return { type: "image", value: category.icon_url };
  if (category.icon_emoji) return { type: "emoji", value: category.icon_emoji };
  return { type: "emoji", value: getCategoryIcon(category.slug) };
}
