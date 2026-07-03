import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;

  const body = await request.json();
  const now = new Date().toISOString();

  const record = {
    id: `cr-manual-${Date.now()}`,
    order_id: body.orderId ?? null,
    order_item_id: null,
    referrer_user_id: body.referrerUserId,
    referred_user_id: body.referredUserId ?? null,
    commission_rule_id: null,
    commission_role: body.commissionRole ?? "custom",
    source_type: "manual" as const,
    source_id: null,
    level: 1,
    order_amount: body.orderAmount ?? 0,
    base_amount: body.baseAmount ?? body.commissionAmount,
    commission_rate: null,
    commission_amount: body.commissionAmount,
    status: "pending_review" as const,
    reason: body.reason ?? "手動建立分潤",
    reviewed_by: null,
    reviewed_at: null,
    issued_by: null,
    issued_at: null,
    payout_method: null,
    payout_note: null,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    mockStore.commissions.unshift(record);
    return NextResponse.json({ record }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("commission_records")
    .insert({
      order_id: body.orderId,
      referrer_user_id: body.referrerUserId,
      referred_user_id: body.referredUserId,
      commission_role: body.commissionRole ?? "custom",
      source_type: "manual",
      level: 1,
      order_amount: body.orderAmount ?? 0,
      base_amount: body.baseAmount ?? body.commissionAmount,
      commission_amount: body.commissionAmount,
      status: "pending_review",
      reason: body.reason ?? "手動建立分潤",
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "manual_commission", "commission_record", data.id, null, data);
  return NextResponse.json({ record: data }, { status: 201 });
}
