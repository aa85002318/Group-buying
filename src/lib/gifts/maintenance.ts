import { createStoreNotification } from "@/lib/admin/store-notifications";
import { availableQuantity, storeAvailableQuantity } from "@/lib/gifts/inventory";
import { campaignLooksLowStock } from "@/lib/gifts/publish-check";
import { autoIssueBirthdayAndNewMemberGifts } from "@/lib/gifts/auto-issue";
import type { GiftCampaign, GiftStoreInventory } from "@/lib/gifts/types";
import { createAdminClient } from "@/lib/supabase/admin";

type ClaimLite = {
  id: string;
  campaign_id: string;
  quantity: number;
  status: string;
  designated_store_id?: string | null;
  gift_item_id?: string | null;
};

async function releaseReservation(claim: ClaimLite) {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("gift_campaigns")
    .select("id, inventory_reservation_mode, inventory_scope, reserved_quantity")
    .eq("id", claim.campaign_id)
    .maybeSingle();
  if (!campaign) return;
  if (campaign.inventory_reservation_mode !== "reserve_on_claim") return;

  const qty = Math.max(1, Number(claim.quantity ?? 1));
  const reserved = Math.max(0, Number(campaign.reserved_quantity ?? 0) - qty);
  await admin
    .from("gift_campaigns")
    .update({ reserved_quantity: reserved, updated_at: new Date().toISOString() })
    .eq("id", campaign.id);

  if (campaign.inventory_scope === "per_store" && claim.designated_store_id) {
    const { data: inv } = await admin
      .from("gift_campaign_store_inventory")
      .select("id, reserved_quantity")
      .eq("campaign_id", claim.campaign_id)
      .eq("store_id", claim.designated_store_id)
      .maybeSingle();
    if (inv) {
      await admin
        .from("gift_campaign_store_inventory")
        .update({
          reserved_quantity: Math.max(0, Number(inv.reserved_quantity) - qty),
          updated_at: new Date().toISOString(),
        })
        .eq("id", inv.id);
    }
  }

  if (claim.gift_item_id) {
    const { data: item } = await admin
      .from("gift_campaign_items")
      .select("id, reserved_quantity, total_quantity")
      .eq("id", claim.gift_item_id)
      .maybeSingle();
    if (item && item.total_quantity != null) {
      await admin
        .from("gift_campaign_items")
        .update({
          reserved_quantity: Math.max(0, Number(item.reserved_quantity ?? 0) - qty),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    }
  }
}

/** 將已過期的可兌換券標為 expired，並釋放領取時保留的庫存 */
export async function expireDueGiftClaims(limit = 500): Promise<{ expired: number }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: due } = await admin
    .from("member_gift_claims")
    .select("id, campaign_id, quantity, status, designated_store_id, gift_item_id, expires_at")
    .eq("status", "available")
    .not("expires_at", "is", null)
    .lt("expires_at", now)
    .limit(limit);

  let expired = 0;
  for (const claim of (due ?? []) as ClaimLite[]) {
    const { data: updated } = await admin
      .from("member_gift_claims")
      .update({
        status: "expired",
        updated_at: now,
      })
      .eq("id", claim.id)
      .eq("status", "available")
      .select("id")
      .maybeSingle();
    if (!updated) continue;
    await releaseReservation(claim);
    await admin.from("gift_redemption_logs").insert({
      claim_id: claim.id,
      campaign_id: claim.campaign_id,
      action: "expire",
      result: "success",
      meta: { auto: true },
    });
    expired += 1;
  }

  return { expired };
}

/** 預約活動到期發布；進行中活動過結束時間改為結束 */
export async function syncGiftCampaignStatuses(): Promise<{
  published: number;
  ended: number;
}> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: toPublish } = await admin
    .from("gift_campaigns")
    .select("id, claim_start_at, activity_start_at")
    .eq("status", "scheduled")
    .limit(200);

  let published = 0;
  for (const c of toPublish ?? []) {
    const start = c.activity_start_at || c.claim_start_at;
    if (start && start > now) continue;
    const { data } = await admin
      .from("gift_campaigns")
      .update({ status: "published", updated_at: now })
      .eq("id", c.id)
      .eq("status", "scheduled")
      .select("id")
      .maybeSingle();
    if (data) published += 1;
  }

  const { data: live } = await admin
    .from("gift_campaigns")
    .select("id, activity_end_at, redeem_end_at, claim_end_at")
    .eq("status", "published")
    .limit(500);

  let ended = 0;
  for (const c of live ?? []) {
    const end = c.activity_end_at || c.redeem_end_at || c.claim_end_at;
    if (!end || end > now) continue;
    const { data } = await admin
      .from("gift_campaigns")
      .update({ status: "ended", updated_at: now })
      .eq("id", c.id)
      .eq("status", "published")
      .select("id")
      .maybeSingle();
    if (data) ended += 1;
  }

  return { published, ended };
}

export async function voidAvailableGiftClaim(opts: {
  claimId: string;
  adminId: string;
  reason: string;
  restoreInventory?: boolean;
}): Promise<{ ok: true } | { error: string; code: string }> {
  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("member_gift_claims")
    .select("*")
    .eq("id", opts.claimId)
    .maybeSingle();
  if (!claim) return { error: "找不到兌換券", code: "not_found" };
  if (claim.status !== "available") {
    return { error: "僅可作廢尚未核銷的兌換券", code: "invalid_status" };
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("member_gift_claims")
    .update({
      status: "cancelled",
      voided_at: now,
      void_reason: opts.reason,
      voided_by: opts.adminId,
      cancelled_at: now,
      cancelled_reason: opts.reason,
      updated_at: now,
    })
    .eq("id", opts.claimId)
    .eq("status", "available")
    .select("*")
    .maybeSingle();

  if (error) return { error: error.message, code: "db_error" };
  if (!updated) return { error: "兌換券狀態已變更", code: "conflict" };

  if (opts.restoreInventory !== false) {
    await releaseReservation({
      id: claim.id,
      campaign_id: claim.campaign_id,
      quantity: claim.quantity,
      status: claim.status,
      designated_store_id: claim.designated_store_id,
      gift_item_id: claim.gift_item_id,
    });
  }

  await admin.from("gift_redemption_logs").insert({
    claim_id: claim.id,
    campaign_id: claim.campaign_id,
    member_id: claim.member_id,
    staff_id: opts.adminId,
    action: "void",
    result: "success",
    failure_reason: opts.reason,
    meta: { restore_inventory: opts.restoreInventory !== false },
  });

  return { ok: true };
}

/** 低庫存／門市額滿前：寫入門市通知（24 小時內同資源不重複） */
export async function notifyLowStockGifts(): Promise<{ notified: number }> {
  const admin = createAdminClient();
  const { data: campaigns } = await admin
    .from("gift_campaigns")
    .select("*")
    .eq("status", "published")
    .limit(200);

  const { data: stores } = await admin
    .from("stores")
    .select("id, name")
    .eq("is_active", true);

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  let notified = 0;

  for (const raw of campaigns ?? []) {
    const c = raw as GiftCampaign;
    const href = `/admin/member-gifts/campaigns/${c.id}`;

    if (c.inventory_scope === "per_store") {
      const { data: invRows } = await admin
        .from("gift_campaign_store_inventory")
        .select("*")
        .eq("campaign_id", c.id);
      for (const row of (invRows ?? []) as GiftStoreInventory[]) {
        const rem = storeAvailableQuantity(row);
        const threshold = Number(row.low_stock_threshold ?? c.low_stock_threshold ?? 10);
        if (rem <= 0 || rem > threshold) continue;
        const resourceId = `${c.id}:${row.store_id}`;
        const { count } = await admin
          .from("store_notifications")
          .select("id", { count: "exact", head: true })
          .eq("resource_type", "gift_campaign_low_stock")
          .eq("resource_id", resourceId)
          .gte("created_at", since);
        if ((count ?? 0) > 0) continue;
        const ok = await createStoreNotification(admin, {
          storeId: row.store_id,
          kind: "general",
          title: `會員禮庫存即將額滿：${c.name}`,
          body: `門市剩餘 ${rem}（安全庫存 ${threshold}）。請確認備貨或調整配發。`,
          href,
          resourceType: "gift_campaign_low_stock",
          resourceId,
        });
        if (ok) notified += 1;
      }
      continue;
    }

    if (!campaignLooksLowStock(c)) continue;
    const rem = availableQuantity(c);
    const targets =
      (c.applicable_redemption_store_ids?.length
        ? stores?.filter((s) => c.applicable_redemption_store_ids!.includes(s.id))
        : stores) ?? [];
    for (const store of targets) {
      const resourceId = `${c.id}:shared:${store.id}`;
      const { count } = await admin
        .from("store_notifications")
        .select("id", { count: "exact", head: true })
        .eq("resource_type", "gift_campaign_low_stock")
        .eq("resource_id", resourceId)
        .gte("created_at", since);
      if ((count ?? 0) > 0) continue;
      const ok = await createStoreNotification(admin, {
        storeId: store.id,
        kind: "general",
        title: `會員禮庫存即將額滿：${c.name}`,
        body: `活動剩餘 ${rem}（安全庫存 ${c.low_stock_threshold ?? 10}）。`,
        href,
        resourceType: "gift_campaign_low_stock",
        resourceId,
      });
      if (ok) notified += 1;
    }
  }

  return { notified };
}

/** 即將到期兌換券提醒（3 天內，每券最多提醒一次／7 天） */
export async function notifyExpiringGiftClaims(): Promise<{ reminded: number }> {
  const admin = createAdminClient();
  const now = Date.now();
  const in3d = new Date(now + 3 * 86400000).toISOString();
  const since = new Date(now - 7 * 86400000).toISOString();

  const { data: due } = await admin
    .from("member_gift_claims")
    .select(
      "id, member_id, expires_at, gift_campaigns(gift_name), gift_campaign_items(gift_name)"
    )
    .eq("status", "available")
    .not("expires_at", "is", null)
    .lte("expires_at", in3d)
    .gt("expires_at", new Date(now).toISOString())
    .limit(200);

  let reminded = 0;
  const { notifyGiftExpiringSoon } = await import("@/lib/gifts/notifications");

  for (const claim of due ?? []) {
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", claim.member_id)
      .eq("reference_id", claim.id)
      .eq("notification_type", "benefit")
      .ilike("title", "%即將到期%")
      .gte("created_at", since);
    if ((count ?? 0) > 0) continue;

    const giftName =
      (claim.gift_campaign_items as { gift_name?: string } | null)?.gift_name ||
      (claim.gift_campaigns as { gift_name?: string } | null)?.gift_name ||
      "會員禮";
    await notifyGiftExpiringSoon(admin, {
      memberId: claim.member_id,
      claimId: claim.id,
      giftName,
      expiresAt: claim.expires_at as string,
    });
    reminded += 1;
  }

  return { reminded };
}

export async function runMemberGiftMaintenance() {
  const [expired, status, lowStock, reminded, autoIssue] = await Promise.all([
    expireDueGiftClaims(),
    syncGiftCampaignStatuses(),
    notifyLowStockGifts(),
    notifyExpiringGiftClaims(),
    autoIssueBirthdayAndNewMemberGifts(40),
  ]);
  return { ...expired, ...status, ...lowStock, ...reminded, auto_issue: autoIssue };
}
