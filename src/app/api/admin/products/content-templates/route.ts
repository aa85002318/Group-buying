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

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ templates: [] });

  const section = req.nextUrl.searchParams.get("section");
  const includeInactive = req.nextUrl.searchParams.get("all") === "1";
  const admin = createAdminClient();
  let q = admin.from("product_content_templates").select(SELECT).order("sort_order").order("name");
  if (section && isProductContentSection(section)) {
    q = q.eq("section", section);
  }
  if (!includeInactive) {
    q = q.eq("is_active", true);
  }
  const { data, error: dbErr } = await q;
  if (dbErr) {
    return NextResponse.json({ error: dbErr.message, templates: [] }, { status: 500 });
  }
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "資料庫未設定" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const section = body.section as ProductContentSection;
  const bodyHtml = cleanRichTextHtml(String(body.body_html ?? ""));
  const sortOrder = Number(body.sort_order) || 0;
  let templateKey = String(body.template_key ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!name) return NextResponse.json({ error: "請填寫名稱" }, { status: 400 });
  if (!isProductContentSection(section)) {
    return NextResponse.json({ error: "區塊類型無效" }, { status: 400 });
  }
  if (!templateKey) {
    templateKey = `${section}_${Date.now().toString(36)}`;
  }

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("product_content_templates")
    .insert({
      name,
      template_key: templateKey,
      section,
      body_html: bodyHtml,
      sort_order: sortOrder,
      is_active: body.is_active !== false,
    })
    .select(SELECT)
    .single();

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }
  return NextResponse.json({ template: data });
}
