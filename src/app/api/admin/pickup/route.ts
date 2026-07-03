import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderStatus } from "@/lib/services/orderService";

export async function GET() {
  const { error } = await requireStaffOrAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    const orders = mockStore.orders
      .filter((o) => o.status === "ready_for_pickup")
      .map((o) => ({
        id: o.id,
        order_number: o.order_number,
        total_amount: o.total_amount,
        status: o.status,
        user_id: o.user_id,
        created_at: o.created_at,
        picked_up: false,
      }));
    return NextResponse.json({ pickups: orders });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("orders")
    .select("id, order_number, total_amount, status, user_id, created_at, profiles!orders_user_id_fkey(full_name, phone)")
    .eq("status", "ready_for_pickup")
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ pickups: data });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  const body = await request.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: "缺少訂單 ID" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const order = mockStore.orders.find((o) => o.id === orderId);
    if (!order) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
    order.status = "completed";
    return NextResponse.json({ order });
  }

  const order = await updateOrderStatus(orderId, "completed");
  if (!order) return NextResponse.json({ error: "更新失敗" }, { status: 404 });

  const admin = createAdminClient();
  await admin.from("pickup_records").insert({
    order_id: orderId,
    staff_user_id: auth!.profile.id,
    picked_up_at: new Date().toISOString(),
    verified_by: auth!.profile.id,
  });

  await logAudit(auth!.profile.id, "mark_pickup", "order", orderId, null, { status: "completed" });
  return NextResponse.json({ order });
}
