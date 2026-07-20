import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ benefit: null, assignments: [] });
  }

  const admin = createAdminClient();
  const [{ data: benefit, error: bErr }, { data: assignments }] = await Promise.all([
    admin.from("member_benefits").select("*").eq("id", id).maybeSingle(),
    admin
      .from("member_benefit_assignments")
      .select("*, profiles:user_id(id, full_name, email, phone)")
      .eq("benefit_id", id)
      .order("assigned_at", { ascending: false })
      .limit(200),
  ]);

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  if (!benefit) return NextResponse.json({ error: "找不到福利" }, { status: 404 });

  return NextResponse.json({ benefit, assignments: assignments ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  if (!isSupabaseConfigured()) return NextResponse.json({ benefit: { id, ...body } });

  const admin = createAdminClient();
  const { data: old } = await admin.from("member_benefits").select("*").eq("id", id).single();

  const updates: Record<string, unknown> = { updated_by: auth!.profile.id };
  for (const key of [
    "title",
    "summary",
    "description",
    "image_url",
    "usage_instructions",
    "usage_location",
    "status",
    "starts_at",
    "ends_at",
  ]) {
    if (body[key] !== undefined) updates[key] = body[key] === "" ? null : body[key];
  }

  const { data, error: updateError } = await admin
    .from("member_benefits")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update", "member_benefit", id, old, data, request as never);
  return NextResponse.json({ benefit: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("member_benefits").select("*").eq("id", id).single();
  const { error: deleteError } = await admin.from("member_benefits").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete", "member_benefit", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
