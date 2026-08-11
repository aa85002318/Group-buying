import { NextResponse } from "next/server";
import { requireFaqAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { SITE_DOCUMENT_META } from "@/lib/site-pages/defaults";
import { listSiteDocuments } from "@/lib/site-pages/service";
import type { SiteDocumentKey } from "@/lib/site-pages/types";

export async function GET() {
  const { error } = await requireFaqAdmin();
  if (error) return error;

  const docs = isSupabaseConfigured() ? await listSiteDocuments() : [];
  const byKey = new Map(docs.map((d) => [d.document_key, d]));

  const documents = (Object.keys(SITE_DOCUMENT_META) as SiteDocumentKey[]).map((key) => ({
    key,
    ...SITE_DOCUMENT_META[key],
    href: `/admin/site-pages/${key}`,
    document: byKey.get(key) ?? null,
  }));

  return NextResponse.json({
    documents,
    links: {
      faq: { href: "/admin/faqs", previewPath: "/faq", title: "常見問題" },
      notifications: {
        href: "/admin/notifications",
        previewPath: "/member/notifications",
        title: "通知中心",
      },
    },
  });
}
