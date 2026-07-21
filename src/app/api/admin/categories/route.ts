import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockCategories } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

async function getCatalogRootId(admin: ReturnType<typeof createAdminClient>, slug: string) {
  const { data } = await admin.from("catalog_roots").select("id").eq("slug", slug).maybeSingle();
  return data?.id as string | undefined;
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const catalog = searchParams.get("catalog");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: mockCategories });
  }

  const admin = createAdminClient();
  let query = admin
    .from("product_categories")
    .select("*")
    .order("path", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (catalog === "baking-materials") {
    const rootId = await getCatalogRootId(admin, "baking-materials");
    if (rootId) {
      query = query.eq("catalog_root_id", rootId);
    }
  }

  const { data, error: fetchError } = await query;

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const category = {
      id: `cat-${Date.now()}`,
      name: body.name,
      slug: body.slug ?? body.name,
      sort_order: body.sort_order ?? 99,
      icon_emoji: body.icon_emoji ?? null,
      icon_url: body.icon_url ?? null,
      is_active: body.is_active !== false,
      parent_id: body.parent_id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCategories.push(category);
    return NextResponse.json({ category }, { status: 201 });
  }

  const admin = createAdminClient();
  let catalogRootId: string | null = body.catalog_root_id ?? null;

  if (body.catalog === "baking-materials") {
    catalogRootId = (await getCatalogRootId(admin, "baking-materials")) ?? null;
  }

  if (body.parent_id) {
    const { data: parent } = await admin
      .from("product_categories")
      .select("id, level, path, catalog_root_id")
      .eq("id", body.parent_id)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ error: "上層分類不存在" }, { status: 400 });
    }
    const nextLevel = (parent.level ?? 1) + 1;
    if (nextLevel > 4) {
      return NextResponse.json({ error: "分類層級最多四層（大／中／小／細）" }, { status: 400 });
    }
    if (!catalogRootId && parent.catalog_root_id) {
      catalogRootId = parent.catalog_root_id as string;
    }
  }

  const slug =
    body.slug?.trim() ||
    String(body.name)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "");

  // level / path 由 DB trigger sync_category_path 依 parent_id + slug 自動計算
  const { data, error: insertError } = await admin
    .from("product_categories")
    .insert({
      name: body.name,
      slug,
      sort_order: body.sort_order ?? 99,
      parent_id: body.parent_id ?? null,
      catalog_root_id: catalogRootId,
      is_active: body.is_active !== false,
      icon_emoji: body.icon_emoji ?? null,
      icon_url: body.icon_url ?? null,
      banner_url: body.banner_url ?? null,
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}
