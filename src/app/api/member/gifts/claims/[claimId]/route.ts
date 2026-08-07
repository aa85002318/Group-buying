import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createGiftQrToken } from "@/lib/gifts/qr-token";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ claimId: string }> }
) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { claimId } = await context.params;

  if (!isSupabaseConfigured()) {
    const { token, expiresAt } = createGiftQrToken({
      claimId,
      campaignId: "mock-monthly-1",
      memberId: auth!.profile.id,
    });
    return NextResponse.json({
      claim: {
        id: claimId,
        status: "available",
        redemption_code: "MGDEMO1234",
        gift_name: "CHIMEIDIY 限定烘焙材料包",
        gift_image_url: null,
        expires_at: new Date(Date.now() + 20 * 86400000).toISOString(),
        quantity: 1,
        stores: [{ id: "mock-store", name: "棋美點心屋大安門市" }],
      },
      qr: { token, expires_at: expiresAt, refresh_ms: 60000 },
      member: {
        display_name: auth!.profile.full_name ?? "會員",
      },
    });
  }

  const admin = createAdminClient();
  const { data: claim, error: cErr } = await admin
    .from("member_gift_claims")
    .select("*, gift_campaigns(*)")
    .eq("id", claimId)
    .eq("member_id", auth!.profile.id)
    .maybeSingle();

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!claim) return NextResponse.json({ error: "找不到兌換券" }, { status: 404 });

  const campaign = claim.gift_campaigns as {
    gift_name?: string;
    gift_image_url?: string | null;
    applicable_redemption_store_ids?: string[] | null;
    terms?: string | null;
    notes?: string | null;
    campaign_type?: string;
    name?: string;
  } | null;

  if (claim.status !== "available") {
    return NextResponse.json({
      claim: {
        id: claim.id,
        status: claim.status,
        redemption_code: null,
        gift_name: campaign?.gift_name,
        gift_image_url: campaign?.gift_image_url,
        expires_at: claim.expires_at,
        quantity: claim.quantity,
        redeemed_at: claim.redeemed_at,
        redemption_number: claim.redemption_number,
        redeemed_store_name_snapshot: claim.redeemed_store_name_snapshot,
        redeemed_staff_code_snapshot: claim.redeemed_staff_code_snapshot,
      },
      qr: null,
      member: { display_name: auth!.profile.full_name ?? "會員" },
    });
  }

  const { token, payload, expiresAt } = createGiftQrToken({
    claimId: claim.id,
    campaignId: claim.campaign_id,
    memberId: claim.member_id,
  });

  await admin
    .from("member_gift_claims")
    .update({ qr_nonce: payload.nonce, updated_at: new Date().toISOString() })
    .eq("id", claim.id);

  const storeIds = campaign?.applicable_redemption_store_ids ?? [];
  let stores: Array<{ id: string; name: string }> = [];
  if (storeIds.length) {
    const { data } = await admin.from("stores").select("id, name").in("id", storeIds);
    stores = (data ?? []).map((s) => ({ id: s.id, name: s.name }));
  }

  return NextResponse.json({
    claim: {
      id: claim.id,
      status: claim.status,
      redemption_code: claim.redemption_code,
      gift_name: campaign?.gift_name,
      gift_image_url: campaign?.gift_image_url,
      campaign_name: campaign?.name,
      campaign_type: campaign?.campaign_type,
      expires_at: claim.expires_at,
      quantity: claim.quantity,
      terms: campaign?.terms,
      notes: campaign?.notes,
      stores,
    },
    qr: { token, expires_at: expiresAt, refresh_ms: 60000 },
    member: { display_name: auth!.profile.full_name ?? "會員" },
  });
}
