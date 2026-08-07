import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";
import { verifyGiftQrToken } from "@/lib/gifts/qr-token";
import { maskMemberName, memberNumberTail } from "@/lib/gifts/status";

export const dynamic = "force-dynamic";

async function findClaimByTokenOrCode(raw: string) {
  const admin = createAdminClient();
  const trimmed = raw.trim();
  const verified = verifyGiftQrToken(trimmed);
  if (verified.ok && verified.payload) {
    const { data } = await admin
      .from("member_gift_claims")
      .select("*, gift_campaigns(*), profiles:member_id(full_name, member_number, member_code)")
      .eq("id", verified.payload.claim_id)
      .maybeSingle();
    return { claim: data, verifyError: null as string | null, payload: verified.payload };
  }

  // Fallback: redemption code
  const { data } = await admin
    .from("member_gift_claims")
    .select("*, gift_campaigns(*), profiles:member_id(full_name, member_number, member_code)")
    .eq("redemption_code", trimmed.toUpperCase())
    .maybeSingle();
  return {
    claim: data,
    verifyError: verified.error === "token_expired" ? "token_expired" : null,
    payload: null,
  };
}

export async function POST(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  if (auth!.profile.role === "customer_service") {
    return NextResponse.json({ error: "客服帳號不可核銷會員禮" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const tokenOrCode = String(body?.token ?? body?.code ?? "").trim();
  if (!tokenOrCode) {
    return NextResponse.json({ error: "請提供 QR Token 或兌換碼" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      valid: true,
      can_redeem: true,
      claim: {
        id: "mock-claim-1",
        status: "available",
        gift_name: "CHIMEIDIY 限定烘焙材料包",
        quantity: 1,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        campaign_type: "monthly_member_gift",
      },
      member: { name_masked: "王＊", member_tail: "0001" },
      store: { id: "mock-store", name: "示範門市", allowed: true },
    });
  }

  const storeId = await getStaffStoreId(auth!.profile.id);
  if (!storeId && auth!.profile.role !== "admin") {
    return NextResponse.json({ error: "尚未綁定門市，無法核銷" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { claim, verifyError } = await findClaimByTokenOrCode(tokenOrCode);
  if (!claim) {
    return NextResponse.json({ error: "找不到兌換券", code: verifyError ?? "not_found" }, { status: 404 });
  }

  let storeName = "門市";
  let allowed = true;
  if (storeId) {
    const { data: store } = await admin.from("stores").select("id, name").eq("id", storeId).maybeSingle();
    storeName = store?.name ?? storeName;
    const allowedIds = (claim.gift_campaigns as { applicable_redemption_store_ids?: string[] } | null)
      ?.applicable_redemption_store_ids ?? [];
    if (allowedIds.length > 0 && !allowedIds.includes(storeId)) {
      allowed = false;
    }
  }

  const profile = claim.profiles as {
    full_name?: string | null;
    member_number?: string | null;
    member_code?: string | null;
  } | null;

  const campaign = claim.gift_campaigns as {
    gift_name?: string;
    gift_image_url?: string | null;
    campaign_type?: string;
    name?: string;
  } | null;

  const canRedeem = claim.status === "available" && allowed;

  return NextResponse.json({
    valid: true,
    can_redeem: canRedeem,
    reason: !allowed
      ? "此兌換券不適用於本門市"
      : claim.status === "redeemed"
        ? "此會員禮已兌換"
        : claim.status !== "available"
          ? `目前狀態：${claim.status}`
          : null,
    claim: {
      id: claim.id,
      status: claim.status,
      gift_name: campaign?.gift_name,
      gift_image_url: campaign?.gift_image_url,
      campaign_name: campaign?.name,
      campaign_type: campaign?.campaign_type,
      quantity: claim.quantity,
      expires_at: claim.expires_at,
      redeemed_at: claim.redeemed_at,
      redemption_number: claim.redemption_number,
      redeemed_store_name_snapshot: claim.redeemed_store_name_snapshot,
      redeemed_staff_code_snapshot: claim.redeemed_staff_code_snapshot,
    },
    member: {
      name_masked: maskMemberName(profile?.full_name),
      member_tail: memberNumberTail(profile?.member_number ?? profile?.member_code),
    },
    store: { id: storeId, name: storeName, allowed },
  });
}
