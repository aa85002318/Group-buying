import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { looksLikeHtml, sanitizeCmsHtml } from "@/lib/cms/safeHtml";
import {
  SITE_DOCUMENT_META,
  defaultSiteDocumentContent,
} from "./defaults";
import {
  type SiteDocumentKey,
  type SiteLegalDocument,
} from "./types";

export async function getSiteDocument(
  key: SiteDocumentKey,
  opts?: { publishedOnly?: boolean }
): Promise<SiteLegalDocument | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  let query = admin.from("site_legal_documents").select("*").eq("document_key", key);
  if (opts?.publishedOnly) query = query.eq("is_published", true);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data as SiteLegalDocument;
}

/**
 * Canonical shipping copy for the storefront.
 *
 * Admin can edit via 後台 › 網站頁面 › 配送說明 (site_legal_documents) or the
 * legacy support_settings.shipping_info field. Those two used to drift, and
 * Next.js was also serving a cached PostgREST read after saves. Prefer the
 * newer of the two published sources so front and back stay aligned.
 */
export async function getShippingDocumentForStorefront(): Promise<SiteLegalDocument | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  const [doc, supportRes] = await Promise.all([
    getSiteDocument("shipping", { publishedOnly: true }),
    admin
      .from("support_settings")
      .select("shipping_info, updated_at")
      .eq("settings_key", "default")
      .maybeSingle(),
  ]);

  const supportContent = String(supportRes.data?.shipping_info ?? "").trim();
  const docContent = String(doc?.content ?? "").trim();
  if (!supportContent && !docContent) return doc;
  if (!supportContent) return doc;
  if (!docContent) {
    return {
      document_key: "shipping",
      title: SITE_DOCUMENT_META.shipping.title,
      content: supportContent,
      content_format: looksLikeHtml(supportContent) ? "html" : "plain",
      document_version: "1.0",
      is_published: true,
      updated_by: null,
      created_at: supportRes.data?.updated_at ?? new Date().toISOString(),
      updated_at: supportRes.data?.updated_at ?? new Date().toISOString(),
    };
  }

  const docTime = doc?.updated_at ? Date.parse(doc.updated_at) : 0;
  const supportTime = supportRes.data?.updated_at
    ? Date.parse(supportRes.data.updated_at)
    : 0;
  if (supportTime > docTime && supportContent !== docContent) {
    return {
      ...doc!,
      content: supportContent,
      content_format: looksLikeHtml(supportContent) ? "html" : "plain",
      updated_at: supportRes.data!.updated_at,
    };
  }
  return doc;
}

/** Keep site_legal_documents.shipping and support_settings.shipping_info identical. */
export async function syncShippingSupportSettings(
  content: string,
  updatedBy: string | null
) {
  if (!isSupabaseConfigured()) return;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("support_settings")
    .select("id")
    .eq("settings_key", "default")
    .maybeSingle();
  const payload = {
    shipping_info: content,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await admin.from("support_settings").update(payload).eq("id", existing.id);
  } else {
    await admin.from("support_settings").insert({ settings_key: "default", ...payload });
  }
}

export async function syncShippingLegalDocument(
  content: string,
  updatedBy: string | null
) {
  if (!isSupabaseConfigured()) return;
  const admin = createAdminClient();
  const meta = SITE_DOCUMENT_META.shipping;
  const format = looksLikeHtml(content) ? "html" : "plain";
  const sanitized = format === "html" ? sanitizeCmsHtml(content) : content.trim();
  await admin.from("site_legal_documents").upsert(
    {
      document_key: "shipping",
      title: meta.title,
      content: sanitized,
      content_format: format,
      document_version: "1.0",
      is_published: true,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "document_key" }
  );
}

export async function listSiteDocuments(): Promise<SiteLegalDocument[]> {
  if (!isSupabaseConfigured()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_legal_documents")
    .select("*")
    .order("document_key");
  return (data ?? []) as SiteLegalDocument[];
}

export function renderSiteDocumentHtml(doc: SiteLegalDocument): string {
  if (doc.content_format === "plain") {
    const escaped = doc.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre style="white-space:pre-wrap;font-family:inherit">${escaped}</pre>`;
  }
  return sanitizeCmsHtml(doc.content);
}

export function emptyDocumentStub(key: SiteDocumentKey): SiteLegalDocument {
  const meta = SITE_DOCUMENT_META[key];
  return {
    document_key: key,
    title: meta.title,
    content: defaultSiteDocumentContent(key),
    content_format: meta.format,
    document_version: "1.0",
    is_published: false,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
