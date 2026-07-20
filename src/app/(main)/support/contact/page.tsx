"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { externalLinkProps, isSafeLinkUrl } from "@/lib/cms/safeHtml";
import type { SupportSettings } from "@/lib/types/database";

export default function SupportContactPage() {
  const [settings, setSettings] = useState<Partial<SupportSettings>>({});

  useEffect(() => {
    fetch("/api/support-settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? {}));
  }, []);

  const links = [
    { label: "LINE", href: settings.line_url },
    { label: "Facebook", href: settings.facebook_url },
    { label: "Instagram", href: settings.instagram_url },
    { label: "Google 地圖", href: settings.google_map_url },
  ].filter((l) => l.href && isSafeLinkUrl(l.href)) as Array<{ label: string; href: string }>;

  return (
    <div className="space-y-4 pb-6">
      <Link href={APP_ROUTES.support} className="inline-flex items-center gap-2 text-caramel">
        <ArrowLeft className="h-4 w-4" /> 返回客服中心
      </Link>
      <h1 className="text-xl font-bold text-caramel">聯絡方式</h1>
      {settings.phone && <p className="text-sm">電話：{settings.phone}</p>}
      {settings.email && <p className="text-sm">Email：{settings.email}</p>}
      {settings.address && <p className="text-sm">地址：{settings.address}</p>}
      {settings.business_hours && <p className="text-sm">營業時間：{settings.business_hours}</p>}
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              {...externalLinkProps(l.href)}
              className="inline-flex items-center gap-1 font-semibold text-primary"
            >
              {l.label} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>
      {settings.support_info && (
        <p className="rounded-2xl bg-surface p-4 text-sm text-foreground-secondary shadow-card">
          {settings.support_info}
        </p>
      )}
    </div>
  );
}
