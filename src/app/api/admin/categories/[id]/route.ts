import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockCategories } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.icon_emoji !== undefined) updates.icon_emoji = body.icon_emoji;
  if (body.icon_url !== undefined) updates.icon_url = body.icon_url;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.parent_id !== undefined) updates.parent_id = body.parent_id;
  if (body.banner_url !== undefined) updates.banner_url = body.banner_url;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.seo_title !== undefined) updates.seo_title = body.seo_title;
  if (body.seo_description !== undefined) updates.seo_description = body.seo_description;

  if (!isSupabaseConfigured()) {
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx < 0) return NextResponse.json({ error: "分類不存在" }, { status: 404 });
    mockCategories[idx] = {
      ...mockCategories[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    } as (typeof mockCategories)[number];
    return NextResponse.json({ category: mockCategories[idx] });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("product_categories").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("product_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update", "product_category", id, old, data, request as never);
  return NextResponse.json({ category: data });
}
