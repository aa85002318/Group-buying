import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftRedeem } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";
import { verifyGiftQrToken } from "@/lib/gifts/qr-token";
import { maskMemberName, memberNumberTail } from "@/lib/gifts/status";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, auth } = await requireGiftRedeem();
  if (error) return error;
  if (auth!.profile.role === "content_editor") {
    return NextResponse.json({ error: "行銷帳號不可核銷會員禮" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const claimId = String(body?.claim_id ?? "").trim();
  const token = String(body?.token ?? "").trim();
  const code = String(body?.code ?? "").trim();
  const giftItemId = String(body?.gift_item_id ?? "").trim() || null;
  const idempotencyKey = String(body?.idempotency_key ?? "").trim() || null;
  const confirmed = Boolean(body?.confirmed);

  if (!confirmed) {
    return NextResponse.json({ error: "請先確認兌換" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      result: {
        redemption_number: "GRDEMO0001",
        gift_name: "CHIMEIDIY 限定烘焙材料包",
        quantity: 1,
        redeemed_at: new Date().toISOString(),
        store_name: "示範門市",
        staff_code: "ST001",
        member: { name_masked: "王＊", member_tail: "0001" },
      },
    });
  }

  const admin = createAdminClient();
  let resolvedClaimId = claimId;

  if (!resolvedClaimId && token) {
    const verified = verifyGiftQrToken(token);
    if (!verified.ok || !verified.payload) {
      return NextResponse.json(
        { error: verified.error === "token_expired" ? "QR Code 已過期，請請會員刷新" : "無效 QR Code" },
        { status: 400 }
      );
    }
    resolvedClaimId = verified.payload.claim_id;
  }

  if (!resolvedClaimId && code) {
    const { data } = await admin
      .from("member_gift_claims")
      .select("id")
      .eq("redemption_code", code.toUpperCase())
      .maybeSingle();
    resolvedClaimId = data?.id ?? "";
  }

  if (!resolvedClaimId) {
    return NextResponse.json({ error: "缺少兌換券資訊" }, { status: 400 });
  }

  const { data: claimForRules } = await admin
    .from("member_gift_claims")
    .select("id, member_id, redemption_code, gift_campaigns(require_self_redeem)")
    .eq("id", resolvedClaimId)
    .maybeSingle();
  const requireSelf =
    (claimForRules?.gift_campaigns as { require_self_redeem?: boolean } | null)
      ?.require_self_redeem !== false;
  if (requireSelf) {
    const verified = token ? verifyGiftQrToken(token) : { ok: false as const };
    const qrOk =
      verified.ok &&
      verified.payload &&
      verified.payload.claim_id === resolvedClaimId &&
      (!claimForRules?.member_id || verified.payload.member_id === claimForRules.member_id);
    const codeCandidate = (code || token).trim().toUpperCase();
    const codeOk =
      Boolean(codeCandidate) &&
      Boolean(claimForRules?.redemption_code) &&
      codeCandidate === String(claimForRules?.redemption_code).toUpperCase();
    if (!qrOk && !codeOk) {
      return NextResponse.json(
        {
          error: "此活動限本人兌換，請掃描有效 QR 或輸入備用兌換碼",
          code: "self_redeem_required",
        },
        { status: 400 }
      );
    }
  }

  const storeId =
    (await getStaffStoreId(auth!.profile.id)) ||
    (auth!.profile.role === "admin" ? String(body?.store_id ?? "") : "");
  if (!storeId) {
    return NextResponse.json({ error: "尚未綁定門市" }, { status: 403 });
  }

  if (giftItemId) {
    const { data: claimRow } = await admin
      .from("member_gift_claims")
      .select("id, gift_item_id, campaign_id, gift_campaigns(item_selection_mode)")
      .eq("id", resolvedClaimId)
      .maybeSingle();
    const mode = (claimRow?.gift_campaigns as { item_selection_mode?: string } | null)
      ?.item_selection_mode;
    if (claimRow && (mode === "staff_pick" || !claimRow.gift_item_id)) {
      const { data: items } = await admin
        .from("gift_campaign_items")
        .select("*")
        .eq("campaign_id", claimRow.campaign_id)
        .eq("is_active", true);
      const list = items ?? [];
      let item = list.find((i) => i.id === giftItemId) ?? null;
      if (item) {
        const { resolveItemWithSubstitute } = await import("@/lib/gifts/publish-check");
        item = resolveItemWithSubstitute(list as never, item as never) as typeof item;
      }
      if (!item) {
        return NextResponse.json({ error: "贈品不存在、已停用或已缺貨" }, { status: 400 });
      }
      await admin
        .from("member_gift_claims")
        .update({
          gift_item_id: item.id,
          quantity: item.quantity_per_redeem ?? 1,
        })
        .eq("id", resolvedClaimId)
        .eq("status", "available");
    }
  }

  const { data: store } = await admin.from("stores").select("id, name").eq("id", storeId).maybeSingle();
  const staffCode =
    (auth!.profile as { staff_code?: string }).staff_code ||
    (auth!.profile.member_number ?? auth!.profile.id.slice(0, 6)).toString();

  const { data: rpcRows, error: rpcErr } = await admin.rpc("redeem_member_gift_claim", {
    p_claim_id: resolvedClaimId,
    p_store_id: storeId,
    p_staff_id: auth!.profile.id,
    p_staff_code: staffCode,
    p_store_name: store?.name ?? "門市",
    p_idempotency_key: idempotencyKey,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
  if (!row || row.failure_code) {
    const codeFail = row?.failure_code as string | undefined;
    // Load prior redemption info for already_redeemed
    const { data: claim } = await admin
      .from("member_gift_claims")
      .select("*, gift_campaigns(gift_name), profiles:member_id(full_name, member_number, member_code)")
      .eq("id", resolvedClaimId)
      .maybeSingle();

    const messages: Record<string, string> = {
      already_redeemed: "此兌換券已使用",
      expired: "此兌換券已過期",
      cancelled: "此兌換券已作廢",
      store_mismatch: "非指定兌換門市",
      out_of_stock: "活動庫存不足",
      not_found: "找不到兌換券",
      campaign_inactive: "活動未開放或已暫停",
      not_started: "兌換尚未開始",
    };

    await admin.from("gift_redemption_logs").insert({
      claim_id: resolvedClaimId,
      campaign_id: claim?.campaign_id ?? null,
      member_id: claim?.member_id ?? null,
      store_id: storeId,
      staff_id: auth!.profile.id,
      action: codeFail === "already_redeemed" ? "redeem_duplicate" : "redeem",
      result: "failure",
      failure_reason: messages[codeFail ?? ""] ?? codeFail ?? "核銷失敗",
      meta: { failure_code: codeFail },
    });

    return NextResponse.json(
      {
        error: messages[codeFail ?? ""] ?? "核銷失敗",
        code: codeFail,
        prior: claim
          ? {
              redemption_number: claim.redemption_number,
              redeemed_at: claim.redeemed_at,
              store_name: claim.redeemed_store_name_snapshot,
              staff_code: claim.redeemed_staff_code_snapshot,
              quantity: claim.quantity,
              gift_name: (claim.gift_campaigns as { gift_name?: string } | null)?.gift_name,
            }
          : null,
      },
      { status: 409 }
    );
  }

  const { data: claim } = await admin
    .from("member_gift_claims")
    .select(
      "*, gift_campaigns(gift_name, campaign_type, inventory_reservation_mode), profiles:member_id(full_name, member_number, member_code)"
    )
    .eq("id", resolvedClaimId)
    .single();

  const { adjustGiftItemRedeemCounters, notifyGiftRedeemed } = await import(
    "@/lib/gifts/notifications"
  );
  await adjustGiftItemRedeemCounters(admin, {
    giftItemId: claim?.gift_item_id,
    quantity: claim?.quantity ?? 1,
    mode: "redeem",
    hadReservation:
      (claim?.gift_campaigns as { inventory_reservation_mode?: string } | null)
        ?.inventory_reservation_mode === "reserve_on_claim",
  });

  if (claim?.member_id) {
    await notifyGiftRedeemed(admin, {
      memberId: claim.member_id,
      claimId: claim.id,
      giftName:
        (claim.gift_campaigns as { gift_name?: string } | null)?.gift_name ?? "會員禮",
      storeName: claim.redeemed_store_name_snapshot ?? store?.name,
    });
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "member_gift_claim",
    resolvedClaimId,
    null,
    { action: "redeem", store_id: storeId, redemption_number: claim?.redemption_number },
    request as never
  );

  const profile = claim?.profiles as {
    full_name?: string | null;
    member_number?: string | null;
    member_code?: string | null;
  } | null;

  return NextResponse.json({
    success: true,
    result: {
      claim_id: claim?.id,
      redemption_number: claim?.redemption_number,
      gift_name: (claim?.gift_campaigns as { gift_name?: string } | null)?.gift_name,
      campaign_type: (claim?.gift_campaigns as { campaign_type?: string } | null)?.campaign_type,
      quantity: claim?.quantity,
      redeemed_at: claim?.redeemed_at,
      store_name: claim?.redeemed_store_name_snapshot ?? store?.name,
      staff_code: claim?.redeemed_staff_code_snapshot ?? staffCode,
      status: "redeemed",
      member: {
        name_masked: maskMemberName(profile?.full_name),
        member_tail: memberNumberTail(profile?.member_number ?? profile?.member_code),
      },
    },
  });
}
