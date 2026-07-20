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
  if (body.contact_name !== undefined) updates.contact_name = body.contact_name?.trim() || null;
  if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone?.trim() || null;
  if (body.contact_email !== undefined) updates.contact_email = body.contact_email?.trim() || null;
  if (body.note !== undefined) updates.note = body.note?.trim() || null;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ supplier: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("suppliers").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin.from("suppliers").update(updates).eq("id", id).select().single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "update", "supplier", id, old, data);
  }

  return NextResponse.json({ supplier: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("suppliers").select("*").eq("id", id).single();
  const { error: deleteError } = await admin.from("suppliers").update({ is_active: false }).eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "delete", "supplier", id, old, { is_active: false });
  }

  return NextResponse.json({ ok: true });
}
