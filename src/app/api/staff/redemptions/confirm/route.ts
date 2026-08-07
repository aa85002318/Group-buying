import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";
import { verifyGiftQrToken } from "@/lib/gifts/qr-token";
import { maskMemberName, memberNumberTail } from "@/lib/gifts/status";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;
  if (auth!.profile.role === "customer_service") {
    return NextResponse.json({ error: "客服帳號不可核銷會員禮" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const claimId = String(body?.claim_id ?? "").trim();
  const token = String(body?.token ?? "").trim();
  const code = String(body?.code ?? "").trim();
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

  const storeId =
    (await getStaffStoreId(auth!.profile.id)) ||
    (auth!.profile.role === "admin" ? String(body?.store_id ?? "") : "");
  if (!storeId) {
    return NextResponse.json({ error: "尚未綁定門市" }, { status: 403 });
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
      already_redeemed: "此會員禮已兌換",
      expired: "兌換券已過期",
      cancelled: "兌換券已作廢",
      store_mismatch: "此兌換券不適用於本門市",
      out_of_stock: "庫存不足",
      not_found: "找不到兌換券",
    };

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
    .select("*, gift_campaigns(gift_name, campaign_type), profiles:member_id(full_name, member_number, member_code)")
    .eq("id", resolvedClaimId)
    .single();

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
