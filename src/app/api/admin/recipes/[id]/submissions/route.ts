import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

const MODERATION = new Set(["pending", "approved", "rejected", "hidden"]);

/** List / moderate recipe submissions (成品分享). */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ submissions: [] });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("recipe_submissions")
    .select("*, recipe_submission_images(*)")
    .eq("recipe_id", id)
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ submissions: data ?? [] });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;
  const body = await request.json();
  const submissionId = String(body.id ?? "");
  if (!submissionId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (body.moderation_status != null && !MODERATION.has(String(body.moderation_status))) {
    return NextResponse.json({ error: "moderation_status 無效" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ submission: body });
  }

  const updates: Record<string, unknown> = {};
  if (body.moderation_status !== undefined) updates.moderation_status = body.moderation_status;
  if (body.is_teacher_pick !== undefined) updates.is_teacher_pick = Boolean(body.is_teacher_pick);

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("recipe_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("recipe_id", recipeId)
    .single();
  if (!old) return NextResponse.json({ error: "成品分享不存在" }, { status: 404 });

  const { data, error: updateError } = await admin
    .from("recipe_submissions")
    .update(updates)
    .eq("id", submissionId)
    .eq("recipe_id", recipeId)
    .select("*, recipe_submission_images(*)")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "update_recipe_submission",
    "recipe_submission",
    submissionId,
    old,
    data
  );
  return NextResponse.json({ submission: data });
}
