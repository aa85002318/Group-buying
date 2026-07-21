import type { Order } from "@/lib/types/database";

export type ReorderCandidate = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  unit?: string | null;
  purchaseCount: number;
  lastPurchasedAt: string;
  score: number;
};

/** Rank App order line items by recency + frequency (client-side, no API changes). */
export function buildReorderCandidates(
  orders: Array<
    Pick<Order, "created_at"> & {
      order_items?: Array<{
        product_id?: string;
        product_name?: string;
        unit_price?: number;
        quantity?: number;
        products?: { image_url?: string | null; unit?: string | null; price?: number } | null;
      }>;
    }
  >,
  limit = 6
): ReorderCandidate[] {
  const map = new Map<string, ReorderCandidate>();

  for (const order of orders) {
    const boughtAt = order.created_at;
    for (const item of order.order_items ?? []) {
      const productId = item.product_id;
      if (!productId) continue;
      const qty = Number(item.quantity ?? 1) || 1;
      const existing = map.get(productId);
      const price = Number(item.unit_price ?? item.products?.price ?? 0);
      const imageUrl = item.products?.image_url ?? existing?.imageUrl ?? null;
      const unit = item.products?.unit ?? existing?.unit ?? null;
      if (existing) {
        existing.purchaseCount += qty;
        if (new Date(boughtAt).getTime() > new Date(existing.lastPurchasedAt).getTime()) {
          existing.lastPurchasedAt = boughtAt;
          existing.price = price || existing.price;
        }
        if (imageUrl) existing.imageUrl = imageUrl;
        if (unit) existing.unit = unit;
      } else {
        map.set(productId, {
          productId,
          name: item.product_name || "商品",
          price,
          imageUrl,
          unit,
          purchaseCount: qty,
          lastPurchasedAt: boughtAt,
          score: 0,
        });
      }
    }
  }

  const now = Date.now();
  const list = Array.from(map.values()).map((c) => {
    const daysAgo = Math.max(
      0,
      (now - new Date(c.lastPurchasedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const recency = Math.max(0, 30 - daysAgo);
    c.score = c.purchaseCount * 10 + recency;
    return c;
  });

  return list.sort((a, b) => b.score - a.score).slice(0, limit);
}
