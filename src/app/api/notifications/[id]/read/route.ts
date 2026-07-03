import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const notification = mockStore.notifications.find(
      (n) => n.id === id && n.user_id === auth!.profile.id
    );
    if (!notification) return NextResponse.json({ error: "通知不存在" }, { status: 404 });
    notification.is_read = true;
    notification.updated_at = now;
    return NextResponse.json({ notification });
  }

  const supabase = await createClient();
  const { data, error: updateError } = await supabase
    .from("user_notifications")
    .update({ is_read: true, read_at: now })
    .eq("id", id)
    .eq("user_id", auth!.profile.id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: "通知不存在" }, { status: 404 });
  return NextResponse.json({ notification: data });
}
