import type { GiftCampaign, GiftCampaignItem } from "@/lib/gifts/types";
import { availableQuantity } from "@/lib/gifts/inventory";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublishIssue = { code: string; message: string };

/** 發布前檢查：缺必填、無庫存、多品項模式無品項等 */
export async function validateCampaignForPublish(
  campaign: GiftCampaign,
  opts?: { items?: GiftCampaignItem[] }
): Promise<PublishIssue[]> {
  const issues: PublishIssue[] = [];
  if (!campaign.name?.trim()) {
    issues.push({ code: "name", message: "請填寫活動名稱" });
  }
  if (!campaign.gift_name?.trim()) {
    issues.push({ code: "gift_name", message: "請填寫贈品名稱" });
  }
  if (!campaign.claim_start_at || !campaign.claim_end_at) {
    issues.push({ code: "claim_window", message: "請設定領取起迄時間" });
  }
  if (!campaign.redeem_start_at || !campaign.redeem_end_at) {
    issues.push({ code: "redeem_window", message: "請設定兌換起迄時間" });
  }
  if (
    campaign.claim_start_at &&
    campaign.claim_end_at &&
    new Date(campaign.claim_start_at) >= new Date(campaign.claim_end_at)
  ) {
    issues.push({ code: "claim_order", message: "領取結束時間必須晚於開始時間" });
  }
  if (campaign.inventory_scope !== "per_store" && Number(campaign.total_quantity ?? 0) < 1) {
    issues.push({ code: "stock", message: "共用庫存總量至少為 1" });
  }

  const mode = campaign.item_selection_mode ?? "single";
  let items = opts?.items;
  if (!items) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("gift_campaign_items")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("is_active", true);
    items = (data ?? []) as GiftCampaignItem[];
  }
  if (mode !== "single" && !(items?.length)) {
    issues.push({
      code: "items",
      message: "多品項模式請先在「兌換品項」建立至少一筆啟用中的贈品",
    });
  }
  if (campaign.require_store_selection && campaign.inventory_scope === "per_store") {
    const admin = createAdminClient();
    const { count } = await admin
      .from("gift_campaign_store_inventory")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .gt("allocated_quantity", 0);
    if ((count ?? 0) < 1) {
      issues.push({
        code: "store_stock",
        message: "門市獨立庫存模式請至少為一家門市配發數量",
      });
    }
  }

  return issues;
}

export function itemAvailableQuantity(
  item: Pick<GiftCampaignItem, "total_quantity" | "reserved_quantity" | "redeemed_quantity">
): number | null {
  if (item.total_quantity == null) return null;
  return Math.max(
    0,
    Number(item.total_quantity) -
      Number(item.reserved_quantity ?? 0) -
      Number(item.redeemed_quantity ?? 0)
  );
}

export function isItemOutOfStock(item: GiftCampaignItem): boolean {
  if (item.is_active === false) return true;
  const avail = itemAvailableQuantity(item);
  return avail !== null && avail <= 0;
}

/** 若品項缺貨且允許替代，沿替代鏈找可用品項（防循環） */
export function resolveItemWithSubstitute(
  list: GiftCampaignItem[],
  start: GiftCampaignItem | null,
  depth = 0
): GiftCampaignItem | null {
  if (!start || depth > 4) return null;
  if (!isItemOutOfStock(start)) return start;
  if (!start.allow_substitute_when_oos || !start.substitute_item_id) return null;
  const sub = list.find((i) => i.id === start.substitute_item_id) ?? null;
  if (!sub || sub.id === start.id) return null;
  return resolveItemWithSubstitute(list, sub, depth + 1);
}

export function campaignLooksLowStock(campaign: GiftCampaign): boolean {
  const rem = availableQuantity(campaign);
  const threshold = Number(campaign.low_stock_threshold ?? 10);
  return rem > 0 && rem <= threshold;
}
