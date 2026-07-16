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

  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.address === "string") updates.address = body.address.trim();
  if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
  if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;
  if (typeof body.business_hours === "string") {
    updates.business_hours = body.business_hours.trim() || null;
  }
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ store: { id, ...updates } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("stores").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("stores")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_store", "stores", id, old, data);
  return NextResponse.json({ store: data });
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
  // Soft-delete: deactivate so historical orders keep the store reference
  const { data: old } = await admin.from("stores").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("stores")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "deactivate_store", "stores", id, old, data);
  return NextResponse.json({ ok: true, store: data });
}
