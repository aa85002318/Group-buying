import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMockNewsBySlug, MOCK_NEWS_POSTS } from "@/lib/mock/news";
import { isSafeLinkUrl, sanitizeCmsHtml } from "@/lib/cms/safeHtml";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const post = MOCK_NEWS_POSTS.find((n) => n.id === id) ?? getMockNewsBySlug(id);
    if (!post) return NextResponse.json({ error: "找不到資訊" }, { status: 404 });
    return NextResponse.json({ post });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("news_posts")
    .select("*, news_categories(id, name, slug)")
    .eq("id", id)
    .single();
  if (fetchError || !data) return NextResponse.json({ error: "找不到資訊" }, { status: 404 });
  return NextResponse.json({ post: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  if (body.related_url && !isSafeLinkUrl(body.related_url)) {
    return NextResponse.json({ error: "相關連結不合法" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ post: { id, ...body } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("news_posts").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "找不到資訊" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_by: auth!.profile.id };
  const fields = [
    "title",
    "slug",
    "summary",
    "cover_image",
    "category_id",
    "content",
    "is_featured",
    "is_important",
    "status",
    "published_at",
    "starts_at",
    "ends_at",
    "related_url",
    "seo_title",
    "seo_description",
    "sort_order",
  ] as const;

  for (const key of fields) {
    if (body[key] !== undefined) {
      updates[key] = body[key] === "" ? null : body[key];
    }
  }
  if (updates.content != null) updates.content = sanitizeCmsHtml(String(updates.content));
  if (body.status === "published" && !body.published_at && !old.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error: updateError } = await admin
    .from("news_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const action =
    body.status === "published" && old.status !== "published"
      ? "publish_news"
      : body.status === "archived"
        ? "archive_news"
        : "update_news";

  await logAudit(
    auth!.profile.id,
    action,
    "news_post",
    id,
    sanitizeAuditPayload(old),
    sanitizeAuditPayload(data)
  );
  return NextResponse.json({ post: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("news_posts").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_news", "news_post", id, null, null);
  return NextResponse.json({ ok: true });
}
