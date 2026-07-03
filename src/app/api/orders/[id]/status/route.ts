import { NextResponse } from "next/server";
import { requireAuth, requireRole, logAudit } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/services/orderService";
import { processOrderCommissions, clawbackCommissions } from "@/lib/services/commissionService";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const staffCheck = await requireRole(["admin", "store_staff"]);
  const userCheck = await requireAuth();

  if (staffCheck.auth) {
    const order = await updateOrderStatus(id, status);
    if (!order) return NextResponse.json({ error: "更新失敗" }, { status: 404 });

    if (status === "completed") {
      await processOrderCommissions(id).catch(() => {});
    }
    if (status === "refunded") {
      await clawbackCommissions(id, "訂單退款").catch(() => {});
    }

    await logAudit(staffCheck.auth.profile.id, "update_order_status", "order", id, null, { status });
    return NextResponse.json({ order });
  }

  if (userCheck.error) return userCheck.error;

  if (status !== "cancelled") {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    const order = mockStore.orders.find((o) => o.id === id && o.user_id === userCheck.auth!.profile.id);
    if (!order) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
    if (!["pending", "awaiting_payment"].includes(order.status)) {
      return NextResponse.json({ error: "此訂單無法取消" }, { status: 400 });
    }
    order.status = "cancelled";
    return NextResponse.json({ order });
  }

  const supabase = await createAdminClient();
  const { data: existing } = await supabase
    .from("orders")
    .select("status, user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== userCheck.auth!.profile.id) {
    return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  }
  if (!["pending", "awaiting_payment"].includes(existing.status)) {
    return NextResponse.json({ error: "此訂單無法取消" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
