import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireContentAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ versions: [] });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("brand_versions")
    .select("id, resource_type, resource_id, action, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(100);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ versions: data ?? [] });
}
