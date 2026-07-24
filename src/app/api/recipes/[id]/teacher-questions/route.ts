import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { rateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseReaderSettings } from "@/lib/recipes/reader-settings";

type Params = { params: Promise<{ id: string }> };

/** Student: list own questions for this recipe */
export async function GET(_request: Request, { params }: Params) {
  const { error: authError, auth } = await requireAuth();
  if (authError) return authError;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ questions: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipe_teacher_questions")
    .select(
      "id, question, photo_url, teacher_reply, replied_at, status, story_page_id, step_id, created_at, recipe_story_pages:story_page_id(id, title)"
    )
    .eq("recipe_id", id)
    .eq("user_id", auth!.profile.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

/** Student: submit 我要提問 */
export async function POST(request: Request, { params }: Params) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`teacher-q:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const { error: authError, auth } = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await request.json();
  const question = String(body.question ?? body.body ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "請填寫問題" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        question: {
          id: `tmp-${Date.now()}`,
          recipe_id: id,
          question,
          status: "open",
        },
      },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data: recipe } = await admin
    .from("recipes")
    .select("id, reader_settings")
    .eq("id", id)
    .maybeSingle();
  if (!recipe) return NextResponse.json({ error: "找不到食譜" }, { status: 404 });

  const settings = parseReaderSettings(recipe.reader_settings);
  if (!settings.showAskTeacher) {
    return NextResponse.json({ error: "此食譜未開放提問" }, { status: 403 });
  }

  const photoUrl = body.photo_url ? String(body.photo_url) : null;
  const storyPageId = body.story_page_id ? String(body.story_page_id) : null;
  const stepId = body.step_id ? String(body.step_id) : null;

  const { data, error } = await admin
    .from("recipe_teacher_questions")
    .insert({
      recipe_id: id,
      user_id: auth!.profile.id,
      story_page_id: storyPageId,
      step_id: stepId,
      question,
      photo_url: photoUrl,
      status: "open",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
