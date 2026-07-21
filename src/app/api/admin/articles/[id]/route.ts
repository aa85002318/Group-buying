import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockArticles } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const article = mockArticles.find((a) => a.id === id);
    if (!article) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    return NextResponse.json({ article });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("articles")
    .select("*, product_categories(name, slug)")
    .eq("id", id)
    .single();

  if (fetchError) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json({ article: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const idx = mockArticles.findIndex((a) => a.id === id);
    if (idx < 0) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    mockArticles[idx] = { ...mockArticles[idx], ...body, updated_at: new Date().toISOString() };
    return NextResponse.json({ article: mockArticles[idx] });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("articles").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("articles")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update", "article", id, old, data, request as never);
  return NextResponse.json({ article: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const idx = mockArticles.findIndex((a) => a.id === id);
    if (idx < 0) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    mockArticles.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("articles").select("*").eq("id", id).single();
  const { error: deleteError } = await admin.from("articles").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete", "article", id, old, null, _request as never);
  return NextResponse.json({ ok: true });
}
