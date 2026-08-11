import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ binding: null });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("line_bindings")
    .select("line_user_id, created_at, updated_at")
    .eq("user_id", auth!.profile.id)
    .maybeSingle();

  return NextResponse.json({
    binding: data
      ? {
          lineUserId: data.line_user_id,
          boundAt: data.updated_at ?? data.created_at,
        }
      : null,
  });
}

export async function DELETE() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: delError } = await admin
    .from("line_bindings")
    .delete()
    .eq("user_id", auth!.profile.id);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
