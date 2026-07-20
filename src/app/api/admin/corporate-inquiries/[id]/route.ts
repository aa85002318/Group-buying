import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await context.params;
  const body = await request.json();

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("corporate_inquiries")
    .update({ status: body.status })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_corporate_inquiry", "corporate_inquiry", id, null, data);
  return NextResponse.json({ inquiry: data });
}
