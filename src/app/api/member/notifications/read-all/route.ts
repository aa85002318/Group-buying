import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", auth!.profile.id)
    .eq("is_read", false);

  if (updateError) return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
