import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth!.profile.id);

  if (updateError) return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
