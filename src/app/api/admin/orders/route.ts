import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * App 訂單列表 — 僅查詢 `orders` 表（CHIMEIDIY App 建立的商城／團購訂單）。
 * 不讀取 POS／門市現場交易。
 */
export async function GET(request: Request) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const type = searchParams.get("type"); // mall | group_buy
  const method = searchParams.get("method"); // store_pickup | home_delivery | cvs_pickup
  const q = searchParams.get("q")?.trim() ?? "";
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

  if (!isSupabaseConfigured()) {
    let orders = [...mockStore.orders];
    if (channel) orders = orders.filter((o) => (o as { channel?: string }).channel === channel);
    if (status) orders = orders.filter((o) => o.status === status);
    return NextResponse.json({ orders });
  }

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(
      "*, profiles!orders_user_id_fkey(full_name, email, phone, member_number, member_code), shipments(method, status), order_items(product_name, quantity)"
    )
    .order("created_at", { ascending: false });

  if (channel && ["website", "group_buy", "store_reservation"].includes(channel)) {
    query = query.eq("channel", channel);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (type === "group_buy") {
    query = query.not("group_buy_event_id", "is", null);
  } else if (type === "mall") {
    query = query.is("group_buy_event_id", null);
  }
  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let orders = data ?? [];

  if (method) {
    orders = orders.filter((o) => {
      const shipments = (o as { shipments?: Array<{ method?: string }> }).shipments ?? [];
      return shipments.some((s) => s.method === method);
    });
  }

  if (q) {
    const lower = q.toLowerCase();
    orders = orders.filter((o) => {
      const profile = (o as {
        profiles?: {
          full_name?: string;
          email?: string;
          phone?: string;
          member_number?: string;
          member_code?: string;
        };
      }).profiles;
      return (
        String(o.order_number ?? "").toLowerCase().includes(lower) ||
        String(o.order_no ?? "").toLowerCase().includes(lower) ||
        String(o.customer_phone ?? "").includes(q) ||
        String(o.customer_name ?? "").toLowerCase().includes(lower) ||
        String(profile?.full_name ?? "").toLowerCase().includes(lower) ||
        String(profile?.email ?? "").toLowerCase().includes(lower) ||
        String(profile?.phone ?? "").includes(q) ||
        String(profile?.member_number ?? "").toLowerCase().includes(lower) ||
        String(profile?.member_code ?? "").toLowerCase().includes(lower)
      );
    });
  }

  return NextResponse.json({ orders });
}
