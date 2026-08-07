import type { GiftCampaign } from "@/lib/gifts/types";

export function availableQuantity(c: Pick<
  GiftCampaign,
  "total_quantity" | "reserved_quantity" | "redeemed_quantity"
>): number {
  return Math.max(
    0,
    Number(c.total_quantity ?? 0) -
      Number(c.reserved_quantity ?? 0) -
      Number(c.redeemed_quantity ?? 0)
  );
}

export function isSoldOut(c: Pick<
  GiftCampaign,
  "total_quantity" | "reserved_quantity" | "redeemed_quantity"
>): boolean {
  return availableQuantity(c) <= 0;
}
