import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  const channel = new URL(request.url).searchParams.get("channel");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ orders: mockStore.orders });
  }

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("*, profiles!orders_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  if (channel && ["website", "group_buy", "store_reservation"].includes(channel)) {
    query = query.eq("channel", channel);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}
