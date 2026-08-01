import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { mapAiChipRow } from "@/lib/shop/ai-assistant";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/shop/ai-chips/[id] */
export async function PATCH(request: Request, ctx: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await ctx.params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ chip: { id, ...body } });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["label", "emoji", "prompt", "sort_order", "is_active"] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_ai_chips").select("*").eq("id", id).single();
  const { data, error } = await admin
    .from("shop_ai_chips")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "shop_ai_chip", id, old, data, request as never);
  return NextResponse.json({ chip: mapAiChipRow(data as Record<string, unknown>) });
}

/** DELETE /api/admin/shop/ai-chips/[id] */
export async function DELETE(request: Request, ctx: Ctx) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await ctx.params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("shop_ai_chips").select("*").eq("id", id).single();
  const { error } = await admin.from("shop_ai_chips").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "shop_ai_chip", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
