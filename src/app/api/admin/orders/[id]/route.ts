import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderById, updateOrderStatus } from "@/lib/services/orderService";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  const { id } = await params;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select(
        "*, profiles!orders_user_id_fkey(full_name, email, phone), order_items(*), pickup_store:stores!orders_pickup_store_id_fkey(name, address, phone), shipments(*), payments(*)"
      )
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
    return NextResponse.json({ order: data });
  }

  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const status = body.order_status ?? body.status;
  if (!status) {
    return NextResponse.json({ error: "請提供 order_status" }, { status: 400 });
  }

  const order = await updateOrderStatus(id, status);
  if (!order) return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  return NextResponse.json({ order });
}
