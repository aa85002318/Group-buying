import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const updates: Record<string, unknown> = {};
  if (body.category !== undefined) updates.category = body.category;
  if (body.question !== undefined) updates.question = body.question.trim();
  if (body.answer !== undefined) updates.answer = body.answer.trim();
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 0;

  const admin = createAdminClient();
  const { data, error: updateError } = await admin.from("faqs").update(updates).eq("id", id).select().single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_faq", "faq", id, null, data);
  return NextResponse.json({ faq: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("faqs").delete().eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_faq", "faq", id, null, null);
  return NextResponse.json({ ok: true });
}
