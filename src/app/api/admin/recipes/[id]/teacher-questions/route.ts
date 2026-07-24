import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMemberNotification } from "@/lib/services/memberNotificationService";

type Params = { params: Promise<{ id: string }> };

/** Admin: list teacher questions for a recipe (optionally open only) */
export async function GET(request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  const status = new URL(request.url).searchParams.get("status");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ questions: [] });
  }

  const admin = createAdminClient();
  let query = admin
    .from("recipe_teacher_questions")
    .select(
      "*, profiles:user_id(id, full_name), recipe_story_pages:story_page_id(id, title, page_type), recipe_steps:step_id(id, step_number, title)"
    )
    .eq("recipe_id", id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

/** Admin: reply to a teacher question and notify student */
export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;
  const body = await request.json();
  const questionId = String(body.id ?? "");
  if (!questionId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ question: body });
  }

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("recipe_teacher_questions")
    .select("*")
    .eq("id", questionId)
    .eq("recipe_id", recipeId)
    .single();
  if (!old) return NextResponse.json({ error: "提問不存在" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.status != null) updates.status = body.status;

  const reply = body.teacher_reply != null ? String(body.teacher_reply).trim() : null;
  if (reply) {
    updates.teacher_reply = reply;
    updates.replied_by = auth!.profile.id;
    updates.replied_at = new Date().toISOString();
    updates.status = "answered";
  }

  const { data, error: updateError } = await admin
    .from("recipe_teacher_questions")
    .update(updates)
    .eq("id", questionId)
    .eq("recipe_id", recipeId)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (reply && old.user_id && old.user_id !== auth!.profile.id) {
    const { data: recipeRow } = await admin
      .from("recipes")
      .select("slug, title")
      .eq("id", recipeId)
      .maybeSingle();
    const slug = recipeRow?.slug || recipeId;
    await createMemberNotification(admin, {
      userId: old.user_id,
      notificationType: "system",
      title: "老師回覆了你的提問",
      message: `你的提問已有老師回覆，請回食譜教材查看。`,
      summary: recipeRow?.title ?? null,
      linkUrl: `/recipes/${slug}?view=full`,
      referenceId: questionId,
    });
    await admin
      .from("recipe_teacher_questions")
      .update({ student_notified_at: new Date().toISOString() })
      .eq("id", questionId);
    data.student_notified_at = new Date().toISOString();
  }

  await logAudit(
    auth!.profile.id,
    "reply_teacher_question",
    "recipe_teacher_questions",
    questionId,
    old,
    data
  );

  return NextResponse.json({ question: data });
}
