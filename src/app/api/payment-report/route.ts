import { NextResponse } from "next/server";
import { requireVerifiedAuth, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { error, auth } = await requireVerifiedAuth();
  if (error) return error;

  const body = await request.json();
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const report = {
      id: `pr-${Date.now()}`,
      order_id: body.orderId,
      user_id: auth!.profile.id,
      amount: body.amount,
      payment_method: body.paymentMethod ?? "bank_transfer",
      last_five_digits: body.lastFiveDigits ?? null,
      proof_image_url: body.proofImageUrl ?? null,
      status: "pending" as const,
      confirmed_by: null,
      confirmed_at: null,
      notes: body.notes ?? null,
      created_at: now,
      updated_at: now,
    };
    mockStore.paymentReports.unshift(report);
    const order = mockStore.orders.find((o) => o.id === body.orderId);
    if (order) order.status = "payment_reported";
    return NextResponse.json({ paymentReport: report }, { status: 201 });
  }

  const supabase = await createClient();
  const { data, error: insertError } = await supabase
    .from("payment_reports")
    .insert({
      order_id: body.orderId,
      user_id: auth!.profile.id,
      amount: body.amount,
      payment_method: body.paymentMethod ?? "bank_transfer",
      last_five_digits: body.lastFiveDigits,
      proof_image_url: body.proofImageUrl,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase.from("orders").update({ status: "payment_reported" }).eq("id", body.orderId);
  await logAudit(auth!.profile.id, "submit_payment_report", "payment_report", data.id, null, data);

  return NextResponse.json({ paymentReport: data }, { status: 201 });
}
