import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const entityType = searchParams.get("entity_type");
  const action = searchParams.get("action");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [] });
  }

  const admin = createAdminClient();
  let query = admin
    .from("audit_logs")
    .select(
      "id, user_id, action, entity_type, entity_id, old_data, new_data, created_at, profiles:profiles!audit_logs_user_id_fkey(full_name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (entityType) query = query.eq("entity_type", entityType);
  if (action) query = query.eq("action", action);

  const { data, error: fetchError } = await query;
  if (fetchError) {
    // Fallback without join if FK name differs
    const fallback = await admin
      .from("audit_logs")
      .select("id, user_id, action, entity_type, entity_id, old_data, new_data, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
    return NextResponse.json({ logs: fallback.data ?? [] });
  }

  return NextResponse.json({ logs: data ?? [] });
}
