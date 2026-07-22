import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.label === "string") updates.label = body.label.trim();
  if (typeof body.prompt === "string") updates.prompt = body.prompt.trim();
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 0;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ prompt: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("home_ai_prompts").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("home_ai_prompts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_home_ai_prompt", "home_ai_prompts", id, old, data);
  return NextResponse.json({ prompt: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("home_ai_prompts").delete().eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_home_ai_prompt", "home_ai_prompts", id, null, null);
  return NextResponse.json({ ok: true });
}
