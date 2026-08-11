import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { sanitizeCmsHtml } from "@/lib/cms/safeHtml";
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
