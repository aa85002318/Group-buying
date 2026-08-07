import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftReverse } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";

export const dynamic = "force-dynamic";

/** 門市主管／總管：建立沖銷申請（主管限本店；總管可直接申請後自核或走核准頁） */
export async function POST(
  request: Request,
  context: { params: Promise<{ claimId: string }> }
) {
  const { error, auth } = await requireGiftReverse();
  if (error) return error;
  const { claimId } = await context.params;

  const body = await request.json().catch(() => null);
  const reason = String(body?.reason ?? "").trim();
  const restoreInventory = body?.restore_inventory !== false;
  const reactivateVoucher = body?.reactivate_voucher !== false;

  if (reason.length < 2) {
    return NextResponse.json({ error: "請填寫沖銷原因" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      request: {
        id: "mock-rev-1",
        claim_id: claimId,
        status: "pending",
        reason,
      },
    });
  }

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("member_gift_claims")
    .select("id, status, campaign_id, redeemed_store_id")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) return NextResponse.json({ error: "找不到兌換券" }, { status: 404 });
  if (claim.status !== "redeemed") {
    return NextResponse.json({ error: "僅已核銷的兌換券可申請沖銷" }, { status: 400 });
  }

  if (auth!.profile.role === "store_manager") {
    const storeId = await getStaffStoreId(auth!.profile.id);
    if (!storeId || claim.redeemed_store_id !== storeId) {
      return NextResponse.json(
        { error: "門市主管僅可申請沖銷本店核銷紀錄" },
        { status: 403 }
      );
    }
  }

  const { data: pending } = await admin
    .from("gift_reversal_requests")
    .select("id")
    .eq("claim_id", claimId)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) {
    return NextResponse.json({ error: "此兌換券已有待審核的沖銷申請" }, { status: 409 });
  }

  const { data: row, error: iErr } = await admin
    .from("gift_reversal_requests")
    .insert({
      claim_id: claimId,
      campaign_id: claim.campaign_id,
      store_id: claim.redeemed_store_id,
      requested_by: auth!.profile.id,
      reason,
      restore_inventory: restoreInventory,
      reactivate_voucher: reactivateVoucher,
      status: "pending",
    })
    .select("*")
    .single();

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });

  await admin.from("gift_redemption_logs").insert({
    claim_id: claimId,
    campaign_id: claim.campaign_id,
    store_id: claim.redeemed_store_id,
    staff_id: auth!.profile.id,
    action: "reversal_request",
    result: "success",
    failure_reason: reason,
    meta: {
      request_id: row.id,
      restore_inventory: restoreInventory,
      reactivate_voucher: reactivateVoucher,
    },
  });

  await logAudit(
    auth!.profile.id,
    "create",
    "gift_reversal_request",
    row.id,
    null,
    { claim_id: claimId, reason },
    request as never
  );

  return NextResponse.json({
    success: true,
    request: row,
    message: "已送出沖銷申請，待總管理員核准",
  });
}
