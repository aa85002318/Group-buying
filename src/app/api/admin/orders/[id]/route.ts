import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderById, updateOrderStatus } from "@/lib/services/orderService";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  const { id } = await params;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select(
        "*, profiles!orders_user_id_fkey(id, full_name, email, phone, member_number, member_code, is_active), order_items(*), pickup_store:stores!orders_pickup_store_id_fkey(name, address, phone), shipments(*), payments(*)"
      )
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });

    const { data: audits } = await admin
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, old_data, new_data, created_at, user_id")
      .eq("entity_type", "order")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(30);

    return NextResponse.json({ order: data, audit_logs: audits ?? [] });
  }

  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  return NextResponse.json({ order, audit_logs: [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireStaffOrAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const status = body.order_status ?? body.status;
  const adminNotes = body.admin_notes;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("orders").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });

  let order = old;

  if (status && status !== old.status) {
    const updated = await updateOrderStatus(id, status);
    if (!updated) return NextResponse.json({ error: "狀態更新失敗" }, { status: 500 });
    order = updated;
    await logAudit(
      auth!.profile.id,
      "update_order_status",
      "order",
      id,
      sanitizeAuditPayload({ status: old.status }),
      sanitizeAuditPayload({ status })
    );
  }

  if (adminNotes !== undefined && adminNotes !== old.admin_notes) {
    const { data: noted, error } = await admin
      .from("orders")
      .update({ admin_notes: adminNotes })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    order = noted;
    await logAudit(
      auth!.profile.id,
      "update_order_admin_notes",
      "order",
      id,
      sanitizeAuditPayload({ admin_notes: old.admin_notes }),
      sanitizeAuditPayload({ admin_notes: adminNotes })
    );
  }

  if (!status && adminNotes === undefined) {
    return NextResponse.json({ error: "請提供 order_status 或 admin_notes" }, { status: 400 });
  }

  return NextResponse.json({ order });
}
