import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { error } = await requireRole(["admin", "store_staff"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!isSupabaseConfigured()) {
    let reports = [...mockStore.paymentReports];
    if (status) reports = reports.filter((r) => r.status === status);
    return NextResponse.json({ paymentReports: reports });
  }

  const supabase = await createClient();
  let query = supabase
    .from("payment_reports")
    .select("*, orders(order_number, total_amount), profiles(full_name, phone)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ paymentReports: data });
}
