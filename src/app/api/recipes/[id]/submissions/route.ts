import { NextResponse } from "next/server";
import { getAuthUser, requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { rateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

const SUCCESS = new Set(["success", "partially_successful", "needs_improvement"]);

/** GET approved submissions (+ own pending if logged in) */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ submissions: [], total: 0 });
  }

  const admin = createAdminClient();
  const { data: recipe } = await admin
    .from("recipes")
    .select("id, status, submission_enabled")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
  if (recipe.submission_enabled === false) {
    return NextResponse.json({ submissions: [], total: 0, disabled: true });
  }

  const auth = await getAuthUser();
  let query = admin
    .from("recipe_submissions")
    .select(
      "*, profiles:user_id(id, full_name), recipe_submission_images(*)",
      { count: "exact" }
    )
    .eq("recipe_id", id)
    .order("is_teacher_pick", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);

  if (auth?.profile.id) {
    // Public approved shares OR own rows (including private)
    query = query.or(
      `and(share_to_community.eq.true,moderation_status.eq.approved),user_id.eq.${auth.profile.id}`
    );
  } else {
    query = query
      .eq("share_to_community", true)
      .eq("moderation_status", "approved");
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const submissions = (data ?? []).map((s) => ({
    ...s,
    recipe_submission_images: [...(s.recipe_submission_images ?? [])].sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
  }));

  return NextResponse.json({
    submissions,
    total: count ?? submissions.length,
    viewer_id: auth?.profile.id ?? null,
  });
}

/** POST create submission (pending moderation) */
export async function POST(request: Request, { params }: Params) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`recipe-sub:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const { error: authError, auth } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const imageUrls = Array.isArray(body.image_urls)
    ? body.image_urls.map(String).filter(Boolean).slice(0, 5)
    : [];

  if (imageUrls.length < 1) {
    return NextResponse.json({ error: "請至少上傳 1 張成品照片" }, { status: 400 });
  }
  if (imageUrls.length > 5) {
    return NextResponse.json({ error: "最多上傳 5 張照片" }, { status: 400 });
  }

  const successStatus = String(body.success_status ?? "success");
  if (!SUCCESS.has(successStatus)) {
    return NextResponse.json({ error: "成功狀態無效" }, { status: 400 });
  }

  const rating =
    body.rating != null && body.rating !== "" ? Number(body.rating) : null;
  if (rating != null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "評分需為 1–5" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        submission: {
          id: `sub-${Date.now()}`,
          recipe_id: id,
          moderation_status: "pending",
          image_urls: imageUrls,
        },
      },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data: recipe } = await admin
    .from("recipes")
    .select("id, status, submission_enabled")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
  if (recipe.submission_enabled === false) {
    return NextResponse.json({ error: "此食譜未開放成品分享" }, { status: 403 });
  }

  const sharePublic = Boolean(body.is_public ?? body.share_to_community);

  const { data, error } = await admin
    .from("recipe_submissions")
    .insert({
      recipe_id: id,
      user_id: auth!.profile.id,
      title: body.title ? String(body.title).trim() : null,
      note: body.note ? String(body.note).trim() : null,
      rating,
      success_status: successStatus,
      recipe_multiplier: Number(body.recipe_multiplier ?? 1) || 1,
      mold_size: body.mold_size ? String(body.mold_size) : null,
      oven_settings: body.oven_settings ? String(body.oven_settings) : null,
      substitutions: body.substitutions ? String(body.substitutions) : null,
      made_on: body.made_on || null,
      share_to_community: sharePublic,
      moderation_status: sharePublic ? "pending" : "hidden",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("recipe_submission_images").insert(
    imageUrls.map((url: string, i: number) => ({
      submission_id: data.id,
      image_url: url,
      sort_order: i,
    }))
  );

  const { data: full } = await admin
    .from("recipe_submissions")
    .select("*, recipe_submission_images(*), profiles:user_id(id, full_name)")
    .eq("id", data.id)
    .single();

  return NextResponse.json(
    {
      submission: full ?? data,
      message: sharePublic
        ? "已送出，審核通過後會公開顯示"
        : "已儲存到我的作品（僅自己可見）",
    },
    { status: 201 }
  );
}
