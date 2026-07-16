import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const body = await request.json().catch(() => ({}));
  const lineUserId = typeof body.lineUserId === "string" ? body.lineUserId.trim() : "";
  if (!lineUserId) {
    return NextResponse.json({ error: "缺少 lineUserId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error: upsertError } = await admin.from("line_bindings").upsert(
    {
      user_id: auth!.profile.id,
      line_user_id: lineUserId,
    },
    { onConflict: "line_user_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

