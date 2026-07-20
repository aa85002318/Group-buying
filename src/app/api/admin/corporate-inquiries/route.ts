import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ inquiries: [] });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("corporate_inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ inquiries: data ?? [] });
}
