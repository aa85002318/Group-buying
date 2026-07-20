import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/types/database";

const AWAITING: OrderStatus[] = ["awaiting_payment", "payment_reported"];
const PICKUP: OrderStatus[] = ["payment_confirmed", "preparing", "ready_for_pickup"];
const COMPLETED: OrderStatus[] = ["completed"];

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      summary: {
        awaitingPayment: 0,
        readyForPickup: 0,
        completed: 0,
        total: 0,
        favoriteCount: 0,
        addressCount: 0,
        unreadNotifications: 0,
        hasCarrier: false,
      },
    });
  }

  const admin = createAdminClient();
  const userId = auth!.profile.id;

  const [ordersRes, favRes, addrRes, notifRes, carrierRes, profileRes] = await Promise.all([
    admin.from("orders").select("status").eq("user_id", userId),
    admin.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("member_addresses").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false),
    admin.from("invoice_carriers").select("id").eq("user_id", userId).maybeSingle(),
    admin.from("profiles").select("member_number").eq("id", userId).single(),
  ]);

  let favoriteCount = favRes.count ?? 0;
  if (favRes.error?.code === "42P01") {
    const legacy = await admin
      .from("product_favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    favoriteCount = legacy.count ?? 0;
  }

  const orders = ordersRes.data ?? [];
  const countBy = (statuses: OrderStatus[]) =>
    orders.filter((o) => statuses.includes(o.status as OrderStatus)).length;

  return NextResponse.json({
    memberNumber: profileRes.data?.member_number ?? null,
    summary: {
      awaitingPayment: countBy(AWAITING),
      readyForPickup: countBy(PICKUP),
      completed: countBy(COMPLETED),
      total: orders.length,
      favoriteCount,
      addressCount: addrRes.count ?? 0,
      unreadNotifications: notifRes.count ?? 0,
      hasCarrier: Boolean(carrierRes.data),
    },
  });
}
