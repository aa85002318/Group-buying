import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", auth!.profile.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== "all") query = query.eq("notification_type", type);

  const { data, error: fetchError, count } = await query;
  if (fetchError) {
    if (fetchError.code === "42P01") return NextResponse.json({ notifications: [], unreadCount: 0 });
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth!.profile.id)
    .eq("is_read", false);

  return NextResponse.json({ notifications: data ?? [], total: count ?? 0, unreadCount: unreadCount ?? 0 });
}
