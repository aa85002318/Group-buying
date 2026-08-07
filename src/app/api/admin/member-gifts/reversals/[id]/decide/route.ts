import { NextResponse } from "next/server";
import { logAudit, requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** 總管理員核准／駁回沖銷申請 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  const decision = String(body?.decision ?? "").trim(); // approve | reject
  const reviewNote = String(body?.review_note ?? "").trim();

  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "請指定 approve 或 reject" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, decision });
  }

  const admin = createAdminClient();
  const { data: reqRow } = await admin
    .from("gift_reversal_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!reqRow) return NextResponse.json({ error: "找不到申請" }, { status: 404 });
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "此申請已審核" }, { status: 400 });
  }

  if (decision === "reject") {
    const { data: updated, error: uErr } = await admin
      .from("gift_reversal_requests")
      .update({
        status: "rejected",
        reviewed_by: auth!.profile.id,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote || "駁回",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .single();
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

    await admin.from("gift_redemption_logs").insert({
      claim_id: reqRow.claim_id,
      campaign_id: reqRow.campaign_id,
      store_id: reqRow.store_id,
      staff_id: auth!.profile.id,
      action: "reversal_reject",
      result: "success",
      failure_reason: reviewNote || "駁回",
      meta: { request_id: id },
    });

    await logAudit(
      auth!.profile.id,
      "update",
      "gift_reversal_request",
      id,
      reqRow,
      { decision: "reject", review_note: reviewNote },
      request as never
    );

    return NextResponse.json({ success: true, request: updated, message: "已駁回沖銷申請" });
  }

  // approve → run atomic reverse then mark approved
  const { data: claimSnap } = await admin
    .from("member_gift_claims")
    .select("gift_item_id, quantity")
    .eq("id", reqRow.claim_id)
    .maybeSingle();
  const { data: camp } = await admin
    .from("gift_campaigns")
    .select("inventory_reservation_mode")
    .eq("id", reqRow.campaign_id)
    .maybeSingle();

  const { data: rpcRows, error: rpcErr } = await admin.rpc("reverse_member_gift_redemption", {
    p_claim_id: reqRow.claim_id,
    p_admin_id: auth!.profile.id,
    p_reason: reqRow.reason,
    p_restore_inventory: reqRow.restore_inventory,
    p_reactivate_voucher: reqRow.reactivate_voucher,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
  if (row?.failure_code) {
    return NextResponse.json(
      { error: "沖銷執行失敗", code: row.failure_code },
      { status: 400 }
    );
  }

  if (reqRow.restore_inventory) {
    const { adjustGiftItemRedeemCounters } = await import("@/lib/gifts/notifications");
    await adjustGiftItemRedeemCounters(admin, {
      giftItemId: claimSnap?.gift_item_id,
      quantity: claimSnap?.quantity ?? 1,
      mode: reqRow.reactivate_voucher ? "reverse_restore" : "reverse_void",
      hadReservation: camp?.inventory_reservation_mode === "reserve_on_claim",
    });
  }

  const { data: updated, error: uErr } = await admin
    .from("gift_reversal_requests")
    .update({
      status: "approved",
      reviewed_by: auth!.profile.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote || "核准",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .single();

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

  await logAudit(
    auth!.profile.id,
    "update",
    "gift_reversal_request",
    id,
    reqRow,
    { decision: "approve", review_note: reviewNote },
    request as never
  );

  return NextResponse.json({
    success: true,
    request: updated,
    message: reqRow.reactivate_voucher
      ? "已核准並重新啟用兌換券"
      : "已核准並作廢兌換券",
  });
}
