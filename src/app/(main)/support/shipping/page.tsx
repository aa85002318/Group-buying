"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { sanitizeCmsHtml } from "@/lib/cms/safeHtml";

export default function SupportShippingPage() {
  const [info, setInfo] = useState("");
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/site-pages/shipping").then((r) => r.json()),
      fetch("/api/support-settings").then((r) => r.json()),
    ]).then(([pageRes, supportRes]) => {
      const doc = pageRes.document;
      if (doc?.content?.trim()) {
        if (doc.content_format === "html") {
          setHtml(doc.content);
          setInfo("");
        } else {
          setHtml(null);
          setInfo(doc.content);
        }
        return;
      }
      setHtml(null);
      setInfo(supportRes.settings?.shipping_info ?? "");
    });
  }, []);

  return (
    <div className="space-y-4 pb-6">
      <Link href={APP_ROUTES.support} className="inline-flex items-center gap-2 text-caramel">
        <ArrowLeft className="h-4 w-4" /> 返回客服中心
      </Link>
      <h1 className="text-xl font-bold text-caramel">配送說明</h1>
      <div className="whitespace-pre-wrap rounded-2xl bg-surface p-4 text-sm text-foreground-secondary shadow-card">
        {html ? (
          <div
            className="whitespace-normal space-y-3 [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(html) }}
          />
        ) : (
          info || "配送說明尚未設定，請洽客服或參考 FAQ。"
        )}
      </div>
      <Link href={`${APP_ROUTES.faq}?category=shipping`} className="text-sm font-semibold text-primary">
        查看配送 FAQ →
      </Link>
    </div>
  );
}
