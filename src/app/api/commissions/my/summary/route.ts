import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    const records = mockStore.commissions.filter((r) => r.referrer_user_id === auth!.profile.id);
    const summary = {
      total: records.reduce((s, r) => s + Number(r.commission_amount), 0),
      pending: records.filter((r) => ["pending_calculation", "pending_review"].includes(r.status))
        .reduce((s, r) => s + Number(r.commission_amount), 0),
      approved: records.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.commission_amount), 0),
      issued: records.filter((r) => r.status === "issued").reduce((s, r) => s + Number(r.commission_amount), 0),
      count: records.length,
    };
    return NextResponse.json({ summary });
  }

  const supabase = await createClient();
  const { data: records } = await supabase
    .from("commission_records")
    .select("commission_amount, status")
    .eq("referrer_user_id", auth!.profile.id);

  const list = records ?? [];
  const summary = {
    total: list.reduce((s, r) => s + Number(r.commission_amount), 0),
    pending: list
      .filter((r) => ["pending_calculation", "pending_review"].includes(r.status))
      .reduce((s, r) => s + Number(r.commission_amount), 0),
    approved: list.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.commission_amount), 0),
    issued: list.filter((r) => r.status === "issued").reduce((s, r) => s + Number(r.commission_amount), 0),
    count: list.length,
  };

  return NextResponse.json({ summary });
}
