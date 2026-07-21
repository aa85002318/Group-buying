import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data, error: updateError } = await admin
    .from("videos")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_video", "video", id, null, data);
  return NextResponse.json({ video: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  const { id } = await params;
  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("videos").delete().eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_video", "video", id, null, null);
  return NextResponse.json({ ok: true });
}
