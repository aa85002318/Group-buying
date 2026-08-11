import { NextResponse } from "next/server";
import { requireFaqAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeCmsHtml } from "@/lib/cms/safeHtml";
import { SITE_DOCUMENT_META, defaultSiteDocumentContent } from "@/lib/site-pages/defaults";
import { emptyDocumentStub, getSiteDocument } from "@/lib/site-pages/service";
import { isSiteDocumentKey } from "@/lib/site-pages/types";

type Ctx = { params: Promise<{ key: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { error } = await requireFaqAdmin();
  if (error) return error;

  const { key } = await ctx.params;
  if (!isSiteDocumentKey(key)) {
    return NextResponse.json({ error: "無效的文件類型" }, { status: 404 });
  }

  const document = (await getSiteDocument(key)) ?? emptyDocumentStub(key);
  return NextResponse.json({
    document,
    meta: SITE_DOCUMENT_META[key],
    defaultContent: defaultSiteDocumentContent(key),
  });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { error, auth } = await requireFaqAdmin();
  if (error) return error;

  const { key } = await ctx.params;
  if (!isSiteDocumentKey(key)) {
    return NextResponse.json({ error: "無效的文件類型" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const meta = SITE_DOCUMENT_META[key];
  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : meta.title;
  const rawContent = typeof body.content === "string" ? body.content : "";
  const content =
    meta.format === "html" ? sanitizeCmsHtml(rawContent) : rawContent.trim();
  const documentVersion =
    typeof body.document_version === "string" && body.document_version.trim()
      ? body.document_version.trim().slice(0, 32)
      : "1.0";
  const isPublished = body.is_published !== false;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      document: {
        document_key: key,
        title,
        content,
        content_format: meta.format,
        document_version: documentVersion,
        is_published: isPublished,
      },
    });
  }

  const admin = createAdminClient();
  const payload = {
    document_key: key,
    title,
    content,
    content_format: meta.format,
    document_version: documentVersion,
    is_published: isPublished,
    updated_by: auth!.profile.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error: upsertError } = await admin
    .from("site_legal_documents")
    .upsert(payload, { onConflict: "document_key" })
    .select("*")
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (key === "shipping") {
    await admin
      .from("support_settings")
      .update({ shipping_info: content, updated_by: auth!.profile.id })
      .eq("settings_key", "default");
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "site_legal_document",
    key,
    null,
    data,
    request as never
  );

  return NextResponse.json({ document: data });
}
