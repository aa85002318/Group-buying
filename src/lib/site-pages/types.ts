export const SITE_DOCUMENT_KEYS = ["privacy", "terms", "shipping"] as const;

export type SiteDocumentKey = (typeof SITE_DOCUMENT_KEYS)[number];

export type SiteDocumentFormat = "html" | "plain";

export type SiteLegalDocument = {
  document_key: SiteDocumentKey;
  title: string;
  content: string;
  content_format: SiteDocumentFormat;
  document_version: string;
  is_published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SitePageHubItem = {
  key: SiteDocumentKey | "faq" | "notifications";
  title: string;
  description: string;
  href: string;
  previewPath: string;
  manageInPlace: boolean;
  document?: SiteLegalDocument | null;
};

export function isSiteDocumentKey(value: string): value is SiteDocumentKey {
  return (SITE_DOCUMENT_KEYS as readonly string[]).includes(value);
}

export function formatLegalUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
