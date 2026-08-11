import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";
import { canonicalizeStatus, pickupCodeAllowed } from "@/lib/fulfillment/status";
import { hashPickupPin } from "@/lib/fulfillment/pickup-code";
import { parsePickupToken } from "@/lib/staff/pickup-token";
import { assertManagerAction, transitionOrderStatus } from "@/lib/fulfillment/transitions";

function maskName(name: string | null | undefined) {
  if (!name) return "—";
  if (name.length <= 1) return name;
  return `${name[0]}○${name.slice(2)}`;
}

function phoneLastThree(phone: string | null | undefined) {
  const p = phone ?? "";
  return p.length >= 3 ? p.slice(-3) : "—";
}

export async function GET(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ orders: [] });
  }

  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "ready";
  const admin = createAdminClient();
  const role = auth!.profile.role;
  const staffStore =
    role === "admin" ? null : await getStaffStoreId(auth!.profile.id);

  if (view === "logs") {
    let logQuery = admin
      .from("pickup_redemptions")
      .select(
        "id, order_id, store_id, staff_id, pos_device, redeemed_at, voided_at, void_reason, orders(order_no, order_number, customer_name)"
      )
      .order("redeemed_at", { ascending: false })
      .limit(50);
    if (staffStore) logQuery = logQuery.eq("store_id", staffStore);
    const { data: logs } = await logQuery;
    return NextResponse.json({ logs: logs ?? [] });
  }

  let query = admin
    .from("orders")
    .select(
      "id, order_no, order_number, status, fulfillment_status, payment_status, customer_name, customer_phone, pickup_deadline_at, created_at, pickup_store_id, store_id"
    )
    .order("pickup_deadline_at", { ascending: true })
    .limit(80);

  if (staffStore) {
    query = query.or(`pickup_store_id.eq.${staffStore},store_id.eq.${staffStore}`);
  }

  const { data } = await query;
  const rows = (data ?? []).map((o) => ({
    ...o,
    fulfillment: canonicalizeStatus(o.status, o.fulfillment_status),
  }));

  const filtered =
    view === "expired"
      ? rows.filter((o) => o.fulfillment === "pickup_expired")
      : rows.filter((o) => o.fulfillment === "ready_for_pickup");

  return NextResponse.json({ orders: filtered });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "lookup");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "示範模式無法核銷" }, { status: 400 });
  }

  const admin = createAdminClient();
  const role = auth!.profile.role;
  const staffStore =
    role === "admin" ? null : await getStaffStoreId(auth!.profile.id);

  if (action === "void") {
    try {
      assertManagerAction(role);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "權限不足" },
        { status: 403 }
      );
    }
    const redemptionId = String(body.redemptionId ?? "");
    if (!redemptionId) {
      return NextResponse.json({ error: "缺少核銷 id" }, { status: 400 });
    }
    await admin
      .from("pickup_redemptions")
      .update({
        voided_at: new Date().toISOString(),
        voided_by: auth!.profile.id,
        void_reason: body.reason ?? "取消核銷",
      })
      .eq("id", redemptionId);
    return NextResponse.json({ ok: true });
  }

  if (action === "redeem") {
    const orderId = String(body.orderId ?? "");
    if (!orderId) return NextResponse.json({ error: "缺少訂單" }, { status: 400 });

    const { data: order } = await admin
      .from("orders")
      .select(
        "id, status, fulfillment_status, payment_status, pickup_store_id, store_id, pickup_deadline_at, pickup_status"
      )
      .eq("id", orderId)
      .single();
    if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

    const fulfillment = canonicalizeStatus(order.status, order.fulfillment_status);
    const storeId = order.pickup_store_id ?? order.store_id;
    if (staffStore && storeId && staffStore !== storeId) {
      return NextResponse.json({ error: "此訂單不屬於您的門市" }, { status: 403 });
    }
    if (!["paid_online", "paid_store"].includes(order.payment_status ?? "") && fulfillment !== "ready_for_pickup" && fulfillment !== "paid" && fulfillment !== "preparing") {
      if (!["paid", "preparing", "ready_for_pickup"].includes(fulfillment)) {
        return NextResponse.json({ error: "訂單尚未付款，不可核銷" }, { status: 400 });
      }
    }
    if (!pickupCodeAllowed(fulfillment)) {
      return NextResponse.json(
        { error: "僅「可取貨」訂單可核銷，請先完成備貨" },
        { status: 400 }
      );
    }
    if (order.pickup_deadline_at && new Date(order.pickup_deadline_at) < new Date()) {
      return NextResponse.json({ error: "已超過取貨期限，請先延長期限" }, { status: 400 });
    }
    if (order.pickup_status === "picked_up") {
      return NextResponse.json({ error: "此訂單已核銷" }, { status: 400 });
    }

    const { data: code } = await admin
      .from("pickup_codes")
      .select("id")
      .eq("order_id", orderId)
      .eq("is_active", true)
      .maybeSingle();

    await transitionOrderStatus({
      orderId,
      to: "picked_up",
      actorId: auth!.profile.id,
      actorRole: role,
      note: "POS 完成取貨",
      request,
    });

    const { data: redemption } = await admin
      .from("pickup_redemptions")
      .insert({
        order_id: orderId,
        pickup_code_id: code?.id ?? null,
        store_id: storeId,
        staff_id: auth!.profile.id,
        pos_device: request.headers.get("user-agent")?.slice(0, 180) ?? null,
      })
      .select("id")
      .single();

    await admin
      .from("inventory_reservations")
      .update({ status: "fulfilled" })
      .eq("order_id", orderId);

    return NextResponse.json({ ok: true, redemptionId: redemption?.id });
  }

  // lookup
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const tokenRaw = typeof body.token === "string" ? body.token : "";
  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  let orderId: string | null = null;

  if (pin && /^\d{6}$/.test(pin)) {
    const { data: code } = await admin
      .from("pickup_codes")
      .select("order_id, expires_at, is_active, redeemed_at")
      .eq("pin_hash", hashPickupPin(pin))
      .eq("is_active", true)
      .maybeSingle();
    if (!code) return NextResponse.json({ error: "取貨碼無效" }, { status: 404 });
    if (code.redeemed_at) {
      return NextResponse.json({ error: "取貨碼已核銷" }, { status: 400 });
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return NextResponse.json({ error: "取貨碼已過期" }, { status: 400 });
    }
    orderId = code.order_id;
  } else if (tokenRaw) {
    const token = parsePickupToken(tokenRaw);
    const { data: byToken } = await admin
      .from("orders")
      .select("id")
      .eq("pickup_token", token)
      .maybeSingle();
    orderId = byToken?.id ?? null;
  } else if (orderNo) {
    const { data: byNo } = await admin
      .from("orders")
      .select("id")
      .or(`order_no.eq.${orderNo},order_number.eq.${orderNo}`)
      .maybeSingle();
    orderId = byNo?.id ?? null;
  } else if (phone) {
    const { data: list } = await admin
      .from("orders")
      .select("id, created_at")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);
    orderId = list?.[0]?.id ?? null;
  }

  if (!orderId) {
    return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
  }

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, order_no, order_number, status, fulfillment_status, payment_status, pickup_status, customer_name, customer_phone, notes, pickup_deadline_at, pickup_store_id, store_id, total_amount, order_items(product_name, quantity, unit_price), pickup_store:stores!orders_pickup_store_id_fkey(name)"
    )
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

  const storeId = order.pickup_store_id ?? order.store_id;
  if (staffStore && storeId && staffStore !== storeId) {
    return NextResponse.json({ error: "此訂單不屬於您的門市" }, { status: 403 });
  }

  return NextResponse.json({
    order: {
      ...order,
      fulfillment: canonicalizeStatus(order.status, order.fulfillment_status),
      customer_name: maskName(order.customer_name),
      phone_last_three: phoneLastThree(order.customer_phone),
      store_name: (order.pickup_store as { name?: string } | null)?.name ?? null,
    },
  });
}
