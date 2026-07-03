import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireRole(["admin", "store_staff"]);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const action = body.action ?? "confirm";
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const report = mockStore.paymentReports.find((r) => r.id === id);
    if (!report) return NextResponse.json({ error: "找不到付款回報" }, { status: 404 });
    report.status = action === "reject" ? "rejected" : "confirmed";
    report.confirmed_by = auth!.profile.id;
    report.confirmed_at = now;
    if (action !== "reject") {
      const order = mockStore.orders.find((o) => o.id === report.order_id);
      if (order) order.status = "payment_confirmed";
    }
    return NextResponse.json({ paymentReport: report });
  }

  const admin = createAdminClient();
  const status = action === "reject" ? "rejected" : "confirmed";
  const { data, error: updateError } = await admin
    .from("payment_reports")
    .update({
      status,
      confirmed_by: auth!.profile.id,
      confirmed_at: now,
      reject_reason: body.rejectReason,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (status === "confirmed") {
    await admin.from("orders").update({ status: "payment_confirmed" }).eq("id", data.order_id);
  }

  await logAudit(auth!.profile.id, "confirm_payment_report", "payment_report", id, null, data);
  return NextResponse.json({ paymentReport: data });
}
