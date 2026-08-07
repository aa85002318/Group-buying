import type { GiftCampaign, GiftStoreInventory } from "@/lib/gifts/types";

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

export function storeAvailableQuantity(
  row: Pick<GiftStoreInventory, "allocated_quantity" | "reserved_quantity" | "redeemed_quantity">
): number {
  return Math.max(
    0,
    Number(row.allocated_quantity ?? 0) -
      Number(row.reserved_quantity ?? 0) -
      Number(row.redeemed_quantity ?? 0)
  );
}

export function campaignRemainingLabel(opts: {
  campaign: Pick<
    GiftCampaign,
    | "inventory_scope"
    | "total_quantity"
    | "reserved_quantity"
    | "redeemed_quantity"
    | "show_remaining_quantity"
    | "sold_out_label"
  >;
  storeRows?: GiftStoreInventory[];
}): string | null {
  const { campaign, storeRows } = opts;
  if (!campaign.show_remaining_quantity) return null;
  if (campaign.inventory_scope === "per_store" && storeRows?.length) {
    const rem = storeRows.reduce((sum, r) => sum + storeAvailableQuantity(r), 0);
    return rem <= 0 ? campaign.sold_out_label || "兌換完畢" : `剩餘 ${rem}`;
  }
  const rem = availableQuantity(campaign);
  return rem <= 0 ? campaign.sold_out_label || "兌換完畢" : `剩餘 ${rem}`;
}
