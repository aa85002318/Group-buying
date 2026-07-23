import { NextResponse } from "next/server";
import { requireAuth, requireContentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { rateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string; discussionId: string }> };

/** GET replies for a discussion */
export async function GET(_request: Request, { params }: Params) {
  const { id, discussionId } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ replies: [] });

  const admin = createAdminClient();
  const { data: disc } = await admin
    .from("recipe_discussions")
    .select("id, recipe_id, status")
    .eq("id", discussionId)
    .eq("recipe_id", id)
    .maybeSingle();

  if (!disc || disc.status === "hidden") {
    return NextResponse.json({ error: "討論不存在" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("recipe_discussion_replies")
    .select("*, profiles:user_id(id, full_name)")
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ replies: data ?? [] });
}

/** POST reply */
export async function POST(request: Request, { params }: Params) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`recipe-reply:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const { error: authError, auth } = await requireAuth();
  if (authError) return authError;

  const { id, discussionId } = await params;
  const body = await request.json();
  const replyBody = String(body.body ?? "").trim();
  if (!replyBody) return NextResponse.json({ error: "請輸入回覆內容" }, { status: 400 });

  let authorRole: "member" | "teacher" | "official" = "member";
  const requested = String(body.author_role ?? "member");
  if (requested === "teacher" || requested === "official") {
    const staff = await requireContentAdmin();
    if (staff.error) {
      return NextResponse.json({ error: "無權使用老師／官方身份" }, { status: 403 });
    }
    authorRole = requested;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        reply: {
          id: `reply-${Date.now()}`,
          discussion_id: discussionId,
          body: replyBody,
          author_role: authorRole,
        },
      },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data: disc } = await admin
    .from("recipe_discussions")
    .select("id, recipe_id, status, reply_count")
    .eq("id", discussionId)
    .eq("recipe_id", id)
    .maybeSingle();

  if (!disc) return NextResponse.json({ error: "討論不存在" }, { status: 404 });
  if (disc.status === "locked" || disc.status === "hidden") {
    return NextResponse.json({ error: "此討論已鎖定或隱藏" }, { status: 403 });
  }

  const imageUrls = Array.isArray(body.image_urls)
    ? body.image_urls.map(String).filter(Boolean).slice(0, 4)
    : [];

  const { data, error } = await admin
    .from("recipe_discussion_replies")
    .insert({
      discussion_id: discussionId,
      user_id: auth!.profile.id,
      body: replyBody,
      image_urls: imageUrls,
      author_role: authorRole,
      is_helpful: false,
      is_best_answer: Boolean(body.is_best_answer) && authorRole !== "member",
    })
    .select("*, profiles:user_id(id, full_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nextStatus =
    disc.status === "open"
      ? authorRole !== "member"
        ? "answered"
        : "open"
      : disc.status;

  await admin
    .from("recipe_discussions")
    .update({
      reply_count: Number(disc.reply_count ?? 0) + 1,
      status: nextStatus,
    })
    .eq("id", discussionId);

  if (data.is_best_answer) {
    await admin
      .from("recipe_discussion_replies")
      .update({ is_best_answer: false })
      .eq("discussion_id", discussionId)
      .neq("id", data.id);
    await admin
      .from("recipe_discussions")
      .update({ status: "resolved" })
      .eq("id", discussionId);
  }

  return NextResponse.json({ reply: data }, { status: 201 });
}

/** PATCH mark helpful / best answer (staff) or like */
export async function PATCH(request: Request, { params }: Params) {
  const { discussionId } = await params;
  const body = await request.json();
  const replyId = String(body.reply_id ?? "");
  const action = String(body.action ?? "");
  if (!replyId) return NextResponse.json({ error: "缺少 reply_id" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  if (action === "like") {
    const { error: authError } = await requireAuth();
    if (authError) return authError;
    const { data: row } = await admin
      .from("recipe_discussion_replies")
      .select("id, like_count")
      .eq("id", replyId)
      .eq("discussion_id", discussionId)
      .maybeSingle();
    if (!row) return NextResponse.json({ error: "回覆不存在" }, { status: 404 });
    const { data, error } = await admin
      .from("recipe_discussion_replies")
      .update({ like_count: Number(row.like_count ?? 0) + 1 })
      .eq("id", replyId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reply: data });
  }

  const staff = await requireContentAdmin();
  if (staff.error) return staff.error;

  if (action === "helpful") {
    const { data, error } = await admin
      .from("recipe_discussion_replies")
      .update({ is_helpful: true })
      .eq("id", replyId)
      .eq("discussion_id", discussionId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reply: data });
  }

  if (action === "best_answer") {
    await admin
      .from("recipe_discussion_replies")
      .update({ is_best_answer: false })
      .eq("discussion_id", discussionId);
    const { data, error } = await admin
      .from("recipe_discussion_replies")
      .update({ is_best_answer: true, is_helpful: true })
      .eq("id", replyId)
      .eq("discussion_id", discussionId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin
      .from("recipe_discussions")
      .update({ status: "resolved" })
      .eq("id", discussionId);
    return NextResponse.json({ reply: data });
  }

  return NextResponse.json({ error: "無效操作" }, { status: 400 });
}
