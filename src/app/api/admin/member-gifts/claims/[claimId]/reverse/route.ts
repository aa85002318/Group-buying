import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftReverseExecute } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** 總管理員直接沖銷（略過申請）。門市主管請改走 reverse-request。 */
export async function POST(
  request: Request,
  context: { params: Promise<{ claimId: string }> }
) {
  const { error, auth } = await requireGiftReverseExecute();
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
      claim_id: claimId,
      restore_inventory: restoreInventory,
      reactivate_voucher: reactivateVoucher,
    });
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("member_gift_claims")
    .select("*")
    .eq("id", claimId)
    .maybeSingle();

  if (!before) {
    return NextResponse.json({ error: "找不到兌換券" }, { status: 404 });
  }
  if (before.status !== "redeemed") {
    return NextResponse.json({ error: "僅已核銷的兌換券可沖銷" }, { status: 400 });
  }

  const { data: rpcRows, error: rpcErr } = await admin.rpc("reverse_member_gift_redemption", {
    p_claim_id: claimId,
    p_admin_id: auth!.profile.id,
    p_reason: reason,
    p_restore_inventory: restoreInventory,
    p_reactivate_voucher: reactivateVoucher,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
  if (row?.failure_code) {
    const messages: Record<string, string> = {
      reason_required: "請填寫沖銷原因",
      not_found: "找不到兌換券",
      not_redeemed: "僅已核銷的兌換券可沖銷",
      campaign_inactive: "活動不存在",
    };
    return NextResponse.json(
      { error: messages[row.failure_code] ?? "沖銷失敗", code: row.failure_code },
      { status: 400 }
    );
  }

  // Close any pending request for this claim
  await admin
    .from("gift_reversal_requests")
    .update({
      status: "approved",
      reviewed_by: auth!.profile.id,
      reviewed_at: new Date().toISOString(),
      review_note: "總管理員直接沖銷",
      updated_at: new Date().toISOString(),
    })
    .eq("claim_id", claimId)
    .eq("status", "pending");

  const { data: after } = await admin
    .from("member_gift_claims")
    .select("*")
    .eq("id", claimId)
    .single();

  const { adjustGiftItemRedeemCounters } = await import("@/lib/gifts/notifications");
  const { data: camp } = await admin
    .from("gift_campaigns")
    .select("inventory_reservation_mode")
    .eq("id", before.campaign_id)
    .maybeSingle();
  if (restoreInventory) {
    await adjustGiftItemRedeemCounters(admin, {
      giftItemId: before.gift_item_id,
      quantity: before.quantity ?? 1,
      mode: reactivateVoucher ? "reverse_restore" : "reverse_void",
      hadReservation: camp?.inventory_reservation_mode === "reserve_on_claim",
    });
  } else {
    // 不回補活動庫存時，仍需回退品項已核銷數
    await adjustGiftItemRedeemCounters(admin, {
      giftItemId: before.gift_item_id,
      quantity: before.quantity ?? 1,
      mode: "reverse_void",
      hadReservation: false,
    });
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "member_gift_claim",
    claimId,
    before,
    {
      action: "reversal_direct",
      reason,
      restore_inventory: restoreInventory,
      reactivate_voucher: reactivateVoucher,
      after,
    },
    request as never
  );

  return NextResponse.json({
    success: true,
    claim: after,
    message: reactivateVoucher
      ? "已沖銷並重新啟用兌換券"
      : "已沖銷並作廢兌換券",
  });
}
