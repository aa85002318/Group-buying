import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      categories: [
        { id: "ac-gb", name: "最新團購", slug: "latest-group-buy", sort_order: 10, is_active: true },
        { id: "ac-news", name: "最新資訊", slug: "latest-news", sort_order: 20, is_active: true },
        { id: "ac-new", name: "新品介紹", slug: "new-products", sort_order: 30, is_active: true },
      ],
    });
  }

  const admin = createAdminClient();
  const { data, error: qError } = await admin
    .from("article_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const slug =
    String(body.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-") || name.toLowerCase().replace(/\s+/g, "-");
  if (!name) return NextResponse.json({ error: "請填寫分類名稱" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ category: { id: `tmp-${Date.now()}`, name, slug } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("article_categories")
    .insert({
      name,
      slug,
      sort_order: Number(body.sort_order ?? 100),
      is_active: body.is_active !== false,
    })
    .select()
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "create",
    "article_categories",
    data.id,
    null,
    data,
    request as never
  );
  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ category: body });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("article_categories").select("*").eq("id", id).single();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name != null) patch.name = String(body.name).trim();
  if (body.slug != null) patch.slug = String(body.slug).trim();
  if (body.sort_order != null) patch.sort_order = Number(body.sort_order);
  if (body.is_active != null) patch.is_active = Boolean(body.is_active);

  const { data, error: uError } = await admin
    .from("article_categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (uError) return NextResponse.json({ error: uError.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "update",
    "article_categories",
    id,
    old,
    data,
    request as never
  );
  return NextResponse.json({ category: data });
}

export async function DELETE(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("article_categories").select("*").eq("id", id).single();
  const { error: dError } = await admin.from("article_categories").delete().eq("id", id);
  if (dError) return NextResponse.json({ error: dError.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "delete",
    "article_categories",
    id,
    old,
    null,
    request as never
  );
  return NextResponse.json({ ok: true });
}
