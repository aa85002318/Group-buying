import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";
import { canonicalizeStatus } from "@/lib/fulfillment/status";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export async function GET(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const storeIdParam = url.searchParams.get("storeId") ?? "";
  const sku = url.searchParams.get("sku")?.trim() ?? "";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ orders: [], stats: {}, stores: [] });
  }

  const admin = createAdminClient();
  const role = auth!.profile.role;
  const staffStoreId =
    role === "admin" || role === "customer_service"
      ? null
      : await getStaffStoreId(auth!.profile.id);

  let query = admin
    .from("orders")
    .select(
      "id, order_no, order_number, status, fulfillment_status, payment_status, pickup_status, total_amount, customer_name, customer_phone, created_at, pickup_deadline_at, ready_at, pickup_store_id, store_id, notes, exception_reason, pickup_store:stores!orders_pickup_store_id_fkey(id, name), order_items(product_name, quantity, product_id)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const scopedStore = storeIdParam || staffStoreId;
  if (scopedStore) {
    query = query.or(`pickup_store_id.eq.${scopedStore},store_id.eq.${scopedStore}`);
  }

  if (q) {
    query = query.or(
      `order_no.ilike.%${q}%,order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`
    );
  }

  const { data, error: fetchError } = await query;
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let orders = (data ?? []).map((o) => ({
    ...o,
    fulfillment: canonicalizeStatus(o.status, o.fulfillment_status),
  }));

  if (status) {
    orders = orders.filter((o) => o.fulfillment === status);
  }
  if (sku) {
    orders = orders.filter((o) =>
      (o.order_items ?? []).some((i: { product_name?: string }) =>
        String(i.product_name ?? "").includes(sku)
      )
    );
  }

  const today = startOfDay();
  const soon = new Date();
  soon.setDate(soon.getDate() + 2);
  const stats = {
    todayNew: orders.filter((o) => o.created_at >= today).length,
    awaitingPrep: orders.filter((o) => ["paid"].includes(o.fulfillment)).length,
    preparing: orders.filter((o) => o.fulfillment === "preparing").length,
    readyToday: orders.filter(
      (o) => o.fulfillment === "ready_for_pickup" && (o.ready_at ?? "") >= today
    ).length,
    pickedToday: orders.filter(
      (o) => ["picked_up", "completed"].includes(o.fulfillment) && (o.ready_at ?? o.created_at) >= today
    ).length,
    expiringSoon: orders.filter(
      (o) =>
        o.fulfillment === "ready_for_pickup" &&
        o.pickup_deadline_at &&
        new Date(o.pickup_deadline_at) <= soon &&
        new Date(o.pickup_deadline_at) > new Date()
    ).length,
    expired: orders.filter((o) => o.fulfillment === "pickup_expired").length,
    exception: orders.filter((o) => o.fulfillment === "exception").length,
  };

  return NextResponse.json({ orders, stats });
}
