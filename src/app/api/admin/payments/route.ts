import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireStaffOrAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ payments: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("payments")
    .select("id, order_id, amount, gateway, status, merchant_trade_no, paid_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ payments: data ?? [] });
}
