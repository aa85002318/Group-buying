import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ notifications: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("push_notifications")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(50);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}
