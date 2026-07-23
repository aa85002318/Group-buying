import { NextResponse } from "next/server";
import { getAuthUser, requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { rateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

const CATEGORIES = new Set([
  "general",
  "failure",
  "substitution",
  "oven",
  "storage",
  "product",
  "other",
]);

/** GET /api/recipes/[id]/discussions — public list (excludes hidden) */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ discussions: [], total: 0 });
  }

  const admin = createAdminClient();
  const { data: recipe } = await admin
    .from("recipes")
    .select("id, status, discussion_enabled")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
  if (recipe.discussion_enabled === false) {
    return NextResponse.json({ discussions: [], total: 0, disabled: true });
  }

  let query = admin
    .from("recipe_discussions")
    .select(
      "*, profiles:user_id(id, full_name), recipe_steps:step_id(id, step_number, title)",
      { count: "exact" }
    )
    .eq("recipe_id", id)
    .neq("status", "hidden")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category && CATEGORIES.has(category)) {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ discussions: data ?? [], total: count ?? 0 });
}

/** POST — create discussion (login required) */
export async function POST(request: Request, { params }: Params) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`recipe-disc:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const { error: authError, auth } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const discussionBody = String(body.body ?? "").trim();
  const category = String(body.category ?? "general");

  if (!title || !discussionBody) {
    return NextResponse.json({ error: "請填寫標題與內容" }, { status: 400 });
  }
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "分類無效" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        discussion: {
          id: `disc-${Date.now()}`,
          recipe_id: id,
          title,
          body: discussionBody,
          category,
          status: "open",
        },
      },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data: recipe } = await admin
    .from("recipes")
    .select("id, status, discussion_enabled, reader_settings")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });

  const askTeacher =
    recipe.reader_settings &&
    typeof recipe.reader_settings === "object" &&
    (recipe.reader_settings as Record<string, unknown>).showAskTeacher !== false;

  // V3「我要提問」可在討論板關閉時仍送出（綁定 story_page_id）
  const isPageQuestion = Boolean(body.story_page_id);
  if (recipe.discussion_enabled === false && !(isPageQuestion && askTeacher !== false)) {
    return NextResponse.json({ error: "此食譜未開放討論" }, { status: 403 });
  }

  const imageUrls = Array.isArray(body.image_urls)
    ? body.image_urls.map(String).filter(Boolean).slice(0, 4)
    : [];

  const { data, error } = await admin
    .from("recipe_discussions")
    .insert({
      recipe_id: id,
      user_id: auth!.profile.id,
      category,
      title,
      body: discussionBody,
      step_id: body.step_id || null,
      story_page_id: body.story_page_id || null,
      media_id: body.media_id || null,
      media_time_seconds:
        body.media_time_seconds != null ? Number(body.media_time_seconds) : null,
      image_urls: imageUrls,
      status: "open",
    })
    .select("*, profiles:user_id(id, full_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discussion: data }, { status: 201 });
}

/** PATCH — like bump (auth optional but preferred) */
export async function PATCH(request: Request, { params }: Params) {
  await params;
  const body = await request.json();
  const discussionId = String(body.discussion_id ?? "");
  const action = String(body.action ?? "");
  if (!discussionId || action !== "like") {
    return NextResponse.json({ error: "無效操作" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("recipe_discussions")
    .select("id, like_count, status")
    .eq("id", discussionId)
    .maybeSingle();
  if (!row || row.status === "hidden") {
    return NextResponse.json({ error: "討論不存在" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("recipe_discussions")
    .update({ like_count: Number(row.like_count ?? 0) + 1 })
    .eq("id", discussionId)
    .select("id, like_count")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discussion: data });
}
