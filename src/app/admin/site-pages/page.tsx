"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  Shield,
  Truck,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SITE_DOCUMENT_META } from "@/lib/site-pages/defaults";
import type { SiteDocumentKey, SiteLegalDocument } from "@/lib/site-pages/types";
import { formatLegalUpdatedAt } from "@/lib/site-pages/types";

type DocCard = {
  key: SiteDocumentKey;
  title: string;
  description: string;
  href: string;
  previewPath: string;
  document: SiteLegalDocument | null;
};

const ICONS = {
  shipping: Truck,
  faq: HelpCircle,
  notifications: Bell,
  terms: FileText,
  privacy: Shield,
} as const;

export default function AdminSitePagesHubPage() {
  const [docs, setDocs] = useState<DocCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/site-pages")
      .then((r) => r.json())
      .then((d) => setDocs(d.documents ?? []))
      .finally(() => setLoading(false));
  }, []);

  const byKey = Object.fromEntries(docs.map((d) => [d.key, d])) as Partial<
    Record<SiteDocumentKey, DocCard>
  >;

  const cards = [
    {
      key: "shipping" as const,
      title: "配送說明",
      description: SITE_DOCUMENT_META.shipping.description,
      href: "/admin/site-pages/shipping",
      preview: "/support/shipping",
      extra: byKey.shipping?.document,
    },
    {
      key: "faq" as const,
      title: "常見問題",
      description: "分類、熱門、排序與啟停用",
      href: "/admin/faqs",
      preview: "/faq",
      extra: null,
    },
    {
      key: "notifications" as const,
      title: "通知中心",
      description: "App 內通知發送、預約與發送紀錄",
      href: "/admin/notifications",
      preview: "/member/notifications",
      extra: null,
    },
    {
      key: "terms" as const,
      title: "服務條款",
      description: SITE_DOCUMENT_META.terms.description,
      href: "/admin/site-pages/terms",
      preview: "/terms",
      extra: byKey.terms?.document,
    },
    {
      key: "privacy" as const,
      title: "隱私權政策",
      description: SITE_DOCUMENT_META.privacy.description,
      href: "/admin/site-pages/privacy",
      preview: "/privacy",
      extra: byKey.privacy?.document,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="說明與法務"
        description="統整前台配送說明、常見問題、通知中心、服務條款與隱私權政策。"
      />

      {loading ? (
        <p className="text-sm text-[#8A94A6]">載入中…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = ICONS[card.key];
            const published = card.extra?.is_published;
            return (
              <Link
                key={card.key}
                href={card.href}
                className="group rounded-[20px] border border-[#E7EAF0] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,.04)] transition hover:border-[#FFE149]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF5C7] text-[#153E73]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-bold text-[#153E73]">{card.title}</h2>
                      <ChevronRight className="h-4 w-4 text-[#8A94A6] transition group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-sm text-[#8A94A6]">{card.description}</p>
                    {card.extra ? (
                      <p className="mt-2 text-xs text-[#687386]">
                        {published ? "已發布" : "草稿"}
                        {card.extra.document_version
                          ? `｜版本 ${card.extra.document_version}`
                          : ""}
                        ｜更新 {formatLegalUpdatedAt(card.extra.updated_at)}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[#687386]">前台：{card.preview}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
