import { availableQuantity } from "@/lib/gifts/inventory";
import type { GiftCampaign } from "@/lib/gifts/types";

export function serializeCampaignPublic(
  c: GiftCampaign,
  storeNames: Record<string, string> = {},
  options?: { fallbackStores?: Array<{ id: string; name: string }> }
) {
  const storeIds = c.applicable_redemption_store_ids ?? [];
  const redemption_stores =
    storeIds.length > 0
      ? storeIds.map((id) => ({
          id,
          name: storeNames[id] ?? "指定門市",
        }))
      : c.require_store_selection
        ? (options?.fallbackStores ?? [])
        : [];

  return {
    id: c.id,
    campaign_type: c.campaign_type,
    campaign_month: c.campaign_month,
    name: c.name,
    gift_name: c.gift_name,
    gift_image_url: c.gift_image_url,
    description: c.description,
    terms: c.terms,
    notes: c.notes,
    tag_label: c.tag_label,
    eligibility_type: c.eligibility_type,
    minimum_spend: c.minimum_spend,
    per_member_limit: c.per_member_limit,
    per_order_quantity: c.per_order_quantity,
    total_quantity: c.total_quantity,
    reserved_quantity: c.reserved_quantity,
    redeemed_quantity: c.redeemed_quantity,
    available_quantity: c.show_remaining_quantity ? availableQuantity(c) : null,
    show_remaining_quantity: c.show_remaining_quantity,
    claim_start_at: c.claim_start_at,
    claim_end_at: c.claim_end_at,
    redeem_start_at: c.redeem_start_at,
    redeem_end_at: c.redeem_end_at,
    status: c.status,
    require_store_selection: Boolean(c.require_store_selection),
    item_selection_mode: c.item_selection_mode ?? "single",
    inventory_scope: c.inventory_scope ?? "shared",
    claim_button_label: c.claim_button_label || "立即領取",
    sold_out_label: c.sold_out_label || "兌換完畢",
    frontend_title: c.frontend_title ?? null,
    frontend_subtitle: c.frontend_subtitle ?? null,
    redemption_stores,
    inventory_reservation_mode: c.inventory_reservation_mode,
  };
}
