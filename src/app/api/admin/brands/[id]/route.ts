import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.slug !== undefined) updates.slug = body.slug?.trim() || null;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url?.trim() || null;
  if (body.country !== undefined) updates.country = body.country?.trim() || null;
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 0;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ brand: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("brands").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin.from("brands").update(updates).eq("id", id).select().single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "update", "brand", id, old, data);
  }

  return NextResponse.json({ brand: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("brands").select("*").eq("id", id).single();
  const { error: deleteError } = await admin.from("brands").update({ is_active: false }).eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "delete", "brand", id, old, { is_active: false });
  }

  return NextResponse.json({ ok: true });
}
