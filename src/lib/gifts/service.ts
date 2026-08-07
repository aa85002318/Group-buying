import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import { isMemberEligibleForCampaign } from "@/lib/gifts/eligibility";
import { generateRedemptionCode } from "@/lib/gifts/qr-token";
import {
  isItemOutOfStock,
  resolveItemWithSubstitute,
} from "@/lib/gifts/publish-check";
import type {
  GiftCampaign,
  GiftCampaignItem,
  GiftItemSelectionMode,
  MemberGiftClaim,
} from "@/lib/gifts/types";

export async function loadStoreNameMap(ids: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return {};
  const admin = createAdminClient();
  const { data } = await admin.from("stores").select("id, name").in("id", unique);
  const map: Record<string, string> = {};
  for (const s of data ?? []) map[s.id] = s.name;
  return map;
}

export async function listActiveStores(): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stores")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  return (data ?? []).map((s) => ({ id: s.id, name: s.name }));
}

export async function listPublishedCampaigns(type?: string): Promise<GiftCampaign[]> {
  const admin = createAdminClient();
  let q = admin
    .from("gift_campaigns")
    .select("*")
    .in("status", ["published", "ended"])
    .order("claim_start_at", { ascending: false });
  if (type) q = q.eq("campaign_type", type);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as GiftCampaign[]).filter((c) => c.show_on_frontend !== false);
}

export async function listMemberClaims(memberId: string): Promise<MemberGiftClaim[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("member_gift_claims")
    .select("*, gift_campaigns(*)")
    .eq("member_id", memberId)
    .order("claimed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberGiftClaim[];
}

async function resolveGiftItemForClaim(
  campaignId: string,
  mode: GiftItemSelectionMode,
  requestedItemId?: string | null
): Promise<{ item: GiftCampaignItem | null; substituted?: boolean } | { error: string; code: string }> {
  const admin = createAdminClient();
  const { data: items, error } = await admin
    .from("gift_campaign_items")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return { error: error.message, code: "db_error" };
  const list = (items ?? []) as GiftCampaignItem[];
  if (!list.length) return { item: null };

  const applySub = (start: GiftCampaignItem | null) => {
    if (!start) return { item: null as GiftCampaignItem | null };
    const resolved = resolveItemWithSubstitute(list, start);
    if (!resolved) {
      return {
        error: "贈品已缺貨且無可用替代品",
        code: "item_oos",
      } as const;
    }
    return {
      item: resolved,
      substituted: resolved.id !== start.id,
    };
  };

  if (mode === "member_pick") {
    if (!requestedItemId) {
      return { error: "請先選擇贈品", code: "item_required" };
    }
    const found = list.find((i) => i.id === requestedItemId);
    if (!found) return { error: "贈品不存在或已停用", code: "item_invalid" };
    const result = applySub(found);
    if ("error" in result) return result;
    return result;
  }

  if (mode === "random") {
    const available = list.filter((i) => !isItemOutOfStock(i));
    const pool = available.length ? available : list;
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? null;
    const result = applySub(pick);
    if ("error" in result) return result;
    return result;
  }

  if (mode === "staff_pick") {
    return { item: null };
  }

  const result = applySub(list[0] ?? null);
  if ("error" in result) return result;
  return result;
}

async function reserveItemInventory(
  item: GiftCampaignItem,
  qty: number
): Promise<{ ok: true } | { error: string; code: string }> {
  if (item.total_quantity == null) return { ok: true };
  const admin = createAdminClient();
  const reserved = Number(item.reserved_quantity ?? 0);
  const redeemed = Number(item.redeemed_quantity ?? 0);
  const { data, error } = await admin
    .from("gift_campaign_items")
    .update({
      reserved_quantity: reserved + qty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id)
    .eq("reserved_quantity", reserved)
    .eq("redeemed_quantity", redeemed)
    .select("id");
  if (error) return { error: error.message, code: "db_error" };
  if (!data?.length) return { error: "贈品庫存不足", code: "item_oos" };
  return { ok: true };
}

export async function claimMonthlyGift(opts: {
  campaignId: string;
  memberId: string;
  profile: {
    id: string;
    created_at?: string | null;
    birthday?: string | null;
    member_level?: string | null;
    member_tags?: string[] | null;
    phone?: string | null;
    email?: string | null;
    email_verified?: boolean | null;
    phone_verified?: boolean | null;
    member_points?: number | null;
  };
  designatedStoreId?: string | null;
  giftItemId?: string | null;
  /** 後台補發：可略過資格／個人上限（仍檢查庫存與活動狀態） */
  adminOverride?: {
    reason: string;
    bypassEligibility?: boolean;
    bypassMemberLimit?: boolean;
  };
}): Promise<{ claim: MemberGiftClaim } | { error: string; code: string }> {
  const admin = createAdminClient();
  const override = opts.adminOverride;
  const { data: campaign, error: cErr } = await admin
    .from("gift_campaigns")
    .select("*")
    .eq("id", opts.campaignId)
    .maybeSingle();
  if (cErr) return { error: cErr.message, code: "db_error" };
  if (!campaign) return { error: "找不到活動", code: "not_found" };
  const c = campaign as GiftCampaign;

  if (
    c.campaign_type !== "monthly_member_gift" &&
    c.campaign_type !== "birthday_gift" &&
    c.campaign_type !== "new_member_gift" &&
    c.campaign_type !== "event_limited_gift" &&
    c.campaign_type !== "targeted_member_gift" &&
    !(override && c.campaign_type === "store_spend_gift")
  ) {
    return { error: "此活動不可自行領取", code: "wrong_type" };
  }
  if (c.status !== "published" && !override) {
    return { error: "活動未開放", code: "disabled" };
  }
  if (c.status === "ended" || c.status === "draft") {
    return { error: "活動狀態不可發券", code: "disabled" };
  }
  if (!override?.bypassEligibility && !isMemberEligibleForCampaign(c, opts.profile)) {
    return { error: "不符合兌換資格", code: "ineligible" };
  }

  const now = new Date();
  if (!override && c.claim_start_at && now < new Date(c.claim_start_at)) {
    return { error: "領取尚未開始", code: "not_started" };
  }
  if (!override && c.claim_end_at && now > new Date(c.claim_end_at)) {
    return { error: "領取已結束", code: "expired" };
  }
  if (availableQuantity(c) <= 0 && c.inventory_scope !== "per_store") {
    return { error: "本月會員禮已兌換完畢", code: "exhausted" };
  }

  const designatedStoreId = opts.designatedStoreId?.trim() || null;
  if (c.require_store_selection && !designatedStoreId) {
    return { error: "請先選擇兌換門市", code: "store_required" };
  }

  if (designatedStoreId) {
    const excluded = c.excluded_store_ids ?? [];
    if (excluded.includes(designatedStoreId)) {
      return { error: "此門市不適用", code: "store_mismatch" };
    }
    const applicable = c.applicable_redemption_store_ids ?? [];
    if (applicable.length > 0 && !applicable.includes(designatedStoreId)) {
      return { error: "此門市不適用", code: "store_mismatch" };
    }
  }

  const { count } = await admin
    .from("member_gift_claims")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", c.id)
    .eq("member_id", opts.memberId)
    .neq("status", "cancelled");

  // 允許重複參加：僅計算「尚可兌換」張數；否則計算所有未作廢領取
  let limitCount = count ?? 0;
  if (c.allow_repeat_participation && !override?.bypassMemberLimit) {
    const { count: availableCount } = await admin
      .from("member_gift_claims")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id)
      .eq("member_id", opts.memberId)
      .eq("status", "available");
    limitCount = availableCount ?? 0;
  }

  if (!override?.bypassMemberLimit && limitCount >= c.per_member_limit) {
    return { error: "已達個人領取上限", code: "limit_reached" };
  }

  if (c.per_member_daily_limit && !override?.bypassMemberLimit) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count: dayCount } = await admin
      .from("member_gift_claims")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id)
      .eq("member_id", opts.memberId)
      .gte("claimed_at", start.toISOString())
      .neq("status", "cancelled");
    if ((dayCount ?? 0) >= c.per_member_daily_limit) {
      return { error: "已達今日領取上限", code: "daily_limit" };
    }
  }

  const issue_sequence = (count ?? 0) + 1;
  const redemption_code = generateRedemptionCode();
  let expires_at = c.redeem_end_at;
  if (c.redeem_within_days && c.redeem_within_days > 0) {
    const until = new Date(now.getTime() + c.redeem_within_days * 86400000);
    if (!expires_at || until < new Date(expires_at)) {
      expires_at = until.toISOString();
    }
  }

  // Reserve shared inventory
  if (c.inventory_reservation_mode === "reserve_on_claim" && c.inventory_scope !== "per_store") {
    const { data: reservedRows, error: rErr } = await admin
      .from("gift_campaigns")
      .update({
        reserved_quantity: c.reserved_quantity + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", c.id)
      .eq("reserved_quantity", c.reserved_quantity)
      .eq("redeemed_quantity", c.redeemed_quantity)
      .select("id");
    if (rErr) return { error: rErr.message, code: "db_error" };
    if (!reservedRows?.length) {
      return { error: "庫存不足或活動忙碌，請稍後再試", code: "exhausted" };
    }
  }

  // Reserve per-store inventory
  if (
    c.inventory_reservation_mode === "reserve_on_claim" &&
    c.inventory_scope === "per_store" &&
    designatedStoreId
  ) {
    const { data: storeInv } = await admin
      .from("gift_campaign_store_inventory")
      .select("*")
      .eq("campaign_id", c.id)
      .eq("store_id", designatedStoreId)
      .maybeSingle();
    if (!storeInv) {
      return { error: "此門市尚無庫存配發", code: "exhausted" };
    }
    const rem =
      Number(storeInv.allocated_quantity) -
      Number(storeInv.reserved_quantity) -
      Number(storeInv.redeemed_quantity);
    if (rem < 1) {
      return { error: "此門市兌換完畢", code: "exhausted" };
    }
    const { data: reservedStore, error: sErr } = await admin
      .from("gift_campaign_store_inventory")
      .update({
        reserved_quantity: Number(storeInv.reserved_quantity) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeInv.id)
      .eq("reserved_quantity", storeInv.reserved_quantity)
      .eq("redeemed_quantity", storeInv.redeemed_quantity)
      .select("id");
    if (sErr || !reservedStore?.length) {
      return { error: "門市庫存不足，請稍後再試", code: "exhausted" };
    }
    // also bump campaign reserved for dashboard totals
    await admin
      .from("gift_campaigns")
      .update({
        reserved_quantity: c.reserved_quantity + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", c.id)
      .eq("reserved_quantity", c.reserved_quantity);
  }

  const mode = (c.item_selection_mode ?? "single") as GiftItemSelectionMode;
  const itemResult = await resolveGiftItemForClaim(c.id, mode, opts.giftItemId);
  if ("error" in itemResult) return itemResult;
  const giftItemId = itemResult.item?.id ?? null;
  const giftQty = itemResult.item?.quantity_per_redeem ?? 1;

  if (itemResult.item && c.inventory_reservation_mode === "reserve_on_claim") {
    const itemReserve = await reserveItemInventory(itemResult.item, giftQty);
    if ("error" in itemReserve) return itemReserve;
  }

  const { data: claim, error: iErr } = await admin
    .from("member_gift_claims")
    .insert({
      campaign_id: c.id,
      member_id: opts.memberId,
      gift_item_id: giftItemId,
      quantity: giftQty,
      issue_sequence,
      redemption_code,
      status: "available",
      expires_at,
      designated_store_id: designatedStoreId,
    })
    .select("*, gift_campaigns(*), gift_campaign_items(*)")
    .single();

  if (iErr) {
    if (itemResult.item && giftItemId && itemResult.item.total_quantity != null) {
      const { data: item } = await admin
        .from("gift_campaign_items")
        .select("id, reserved_quantity")
        .eq("id", giftItemId)
        .maybeSingle();
      if (item) {
        await admin
          .from("gift_campaign_items")
          .update({
            reserved_quantity: Math.max(0, Number(item.reserved_quantity) - giftQty),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }
    }
    if (c.inventory_reservation_mode === "reserve_on_claim") {
      if (c.inventory_scope === "per_store" && designatedStoreId) {
        const { data: storeInv } = await admin
          .from("gift_campaign_store_inventory")
          .select("id, reserved_quantity")
          .eq("campaign_id", c.id)
          .eq("store_id", designatedStoreId)
          .maybeSingle();
        if (storeInv) {
          await admin
            .from("gift_campaign_store_inventory")
            .update({
              reserved_quantity: Math.max(0, Number(storeInv.reserved_quantity) - 1),
              updated_at: new Date().toISOString(),
            })
            .eq("id", storeInv.id);
        }
      }
      await admin
        .from("gift_campaigns")
        .update({
          reserved_quantity: Math.max(0, c.reserved_quantity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", c.id);
    }
    if (iErr.code === "23505") {
      return { error: "您已領取此活動", code: "already_claimed" };
    }
    return { error: iErr.message, code: "db_error" };
  }

  await admin.from("gift_redemption_logs").insert({
    claim_id: claim.id,
    campaign_id: c.id,
    member_id: opts.memberId,
    store_id: designatedStoreId,
    action: override ? "admin_reissue" : "claim",
    result: "success",
    meta: {
      ...(itemResult.substituted ? { substituted: true, gift_item_id: giftItemId } : {}),
      ...(override ? { reason: override.reason, admin_override: true } : {}),
    },
  });

  try {
    const { notifyGiftClaimed } = await import("@/lib/gifts/notifications");
    await notifyGiftClaimed(admin, {
      memberId: opts.memberId,
      claimId: claim.id,
      giftName: itemResult.item?.gift_name || c.gift_name,
      expiresAt: expires_at,
    });
  } catch {
    // non-blocking
  }

  return { claim: claim as MemberGiftClaim };
}
