"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DesktopBrandLogo } from "@/components/desktop/DesktopBrandLogo";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DESKTOP_COLORS } from "@/lib/desktop/brand-assets";
import {
  DEFAULT_DESKTOP_FOOTER_SETTINGS,
  normalizeDesktopFooterSettings,
  type DesktopFooterSettings,
} from "@/lib/desktop/footer-settings";
import { APP_ROUTES } from "@/lib/site-links";

export function DesktopFooter() {
  const [settings, setSettings] = useState<DesktopFooterSettings>(
    DEFAULT_DESKTOP_FOOTER_SETTINGS
  );

  useEffect(() => {
    fetch("/api/layout-settings?page_key=global&platform=desktop")
      .then((r) => r.json())
      .then((d) => {
        const footer = (d.settings as Array<{ section_key: string; settings_json: unknown }>)?.find(
          (s) => s.section_key === "footer"
        );
        if (footer) setSettings(normalizeDesktopFooterSettings(footer.settings_json));
      })
      .catch(() => {});
  }, []);

  return (
    <footer
      className="mt-8 border-t border-[#E9EDF2] text-[#153E73]"
      style={{ background: DESKTOP_COLORS.cream }}
    >
      <DesktopContainer className="grid gap-8 py-10 md:grid-cols-4 xl:grid-cols-5">
        <div className="space-y-3 md:col-span-1">
          <DesktopBrandLogo height={36} />
          <p className="text-sm font-semibold tracking-wide text-[#153E73]">{settings.tagline}</p>
          <p className="max-w-xs text-sm leading-relaxed text-[#687386]">{settings.about}</p>
          {settings.show_social ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {settings.social_links.map((s) => (
                <Link
                  key={`${s.label}-${s.href}`}
                  href={s.href}
                  className="text-sm font-semibold text-[#79C7E8] hover:underline"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        {settings.columns.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-sm font-bold text-[#153E73]">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={`${col.title}-${link.href}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#687386] transition-colors hover:text-[#153E73]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {settings.newsletter_enabled ? (
          <div>
            <p className="mb-3 text-sm font-bold text-[#153E73]">{settings.newsletter_title}</p>
            <p className="mb-3 text-sm text-[#687386]">{settings.newsletter_placeholder}</p>
            <Link
              href={APP_ROUTES.member}
              className="inline-flex h-10 items-center rounded-full bg-[#153E73] px-4 text-sm font-bold text-white"
            >
              訂閱／加入會員
            </Link>
          </div>
        ) : null}
      </DesktopContainer>
      <div className="border-t border-[#E9EDF2] py-3 text-center text-xs text-[#687386]">
        © {new Date().getFullYear()} CHIMEIDIY ·{" "}
        <Link href={APP_ROUTES.terms} className="hover:underline">
          服務條款
        </Link>
        {" · "}
        <Link href={APP_ROUTES.privacy} className="hover:underline">
          隱私權政策
        </Link>
      </div>
    </footer>
  );
}
