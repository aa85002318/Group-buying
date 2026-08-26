import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanRichTextHtml } from "@/lib/cms/safeHtml";
import {
  isProductContentSection,
  type ProductContentSection,
} from "@/lib/admin/product-content-templates";

export const dynamic = "force-dynamic";

const SELECT =
  "id, name, template_key, section, body_html, sort_order, is_active, created_at, updated_at";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "資料庫未設定" }, { status: 503 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "請填寫名稱" }, { status: 400 });
    patch.name = name;
  }
  if (body.section !== undefined) {
    if (!isProductContentSection(body.section)) {
      return NextResponse.json({ error: "區塊類型無效" }, { status: 400 });
    }
    patch.section = body.section as ProductContentSection;
  }
  if (body.body_html !== undefined) {
    patch.body_html = cleanRichTextHtml(String(body.body_html));
  }
  if (body.sort_order !== undefined) {
    patch.sort_order = Number(body.sort_order) || 0;
  }
  if (body.is_active !== undefined) {
    patch.is_active = Boolean(body.is_active);
  }

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("product_content_templates")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }
  return NextResponse.json({ template: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "資料庫未設定" }, { status: 503 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error: dbErr } = await admin
    .from("product_content_templates")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
