import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    const notifications = mockStore.notifications.filter((n) => n.user_id === auth!.profile.id);
    return NextResponse.json({ notifications });
  }

  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", auth!.profile.id)
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}
