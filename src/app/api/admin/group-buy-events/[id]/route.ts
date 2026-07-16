import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_FIELDS = [
  "title",
  "description",
  "banner_url",
  "banner_aspect_ratio",
  "is_homepage_featured",
  "homepage_sort_order",
  "linked_product_id",
  "start_at",
  "end_at",
  "status",
  "store_id",
  "leader_user_id",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      const value = body[key];
      updates[key] = key === "linked_product_id" && !value ? null : value;
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      event: { id, ...updates, updated_at: new Date().toISOString() },
    });
  }

  const admin = createAdminClient();

  const { data: old } = await admin.from("group_buy_events").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("group_buy_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_group_buy", "group_buy_event", id, old, data);
  return NextResponse.json({ event: data });
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
  const { error: deleteError } = await admin.from("group_buy_events").delete().eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_group_buy", "group_buy_event", id, null, null);
  return NextResponse.json({ ok: true });
}
