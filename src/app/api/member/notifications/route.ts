import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { stripHtmlToText } from "@/lib/cms/safeHtml";
import { categoryFilterTypes } from "@/lib/services/notificationCampaignService";

export async function GET(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "all";
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

  const types = categoryFilterTypes(type);
  if (types?.length === 1) query = query.eq("notification_type", types[0]);
  else if (types && types.length > 1) query = query.in("notification_type", types);

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

  const notifications = (data ?? []).map((n) => ({
    ...n,
    title: stripHtmlToText(n.title),
    message: stripHtmlToText(n.message),
    summary: n.summary ? stripHtmlToText(n.summary) : null,
  }));

  return NextResponse.json({
    notifications,
    total: count ?? 0,
    unreadCount: unreadCount ?? 0,
  });
}
