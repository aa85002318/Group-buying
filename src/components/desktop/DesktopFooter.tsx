"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DesktopBrandLogo } from "@/components/desktop/DesktopBrandLogo";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import {
  DEFAULT_DESKTOP_FOOTER_SETTINGS,
  normalizeDesktopFooterSettings,
  type DesktopFooterSettings,
} from "@/lib/desktop/footer-settings";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

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

  // Phone: link columns fold into an accordion (one DOM; md+ always open).
  const [openCol, setOpenCol] = useState<number | null>(0);

  return (
    <footer className="mt-8 bg-[#153E73] text-[#DCE6F5]">
      <DesktopContainer className="grid gap-6 pb-6 pt-[clamp(28px,4vw,56px)] md:grid-cols-4 md:gap-8 xl:grid-cols-5">
        <div className="space-y-3 md:col-span-1">
          <span className="inline-flex rounded-xl bg-white px-3 py-2">
            <DesktopBrandLogo height={36} />
          </span>
          {settings.tagline ? <p className="text-sm font-semibold tracking-wide text-white">{settings.tagline}</p> : null}
          {settings.about ? <p className="max-w-xs text-sm leading-relaxed">{settings.about}</p> : null}
          {settings.show_social ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {settings.social_links.map((s) => (
                <Link key={`${s.label}-${s.href}`} href={s.href} className="text-sm font-semibold text-[#FFD454] hover:underline">
                  {s.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="md:contents">
          {settings.columns.map((col, i) => {
            const open = openCol === i;
            return (
              <div key={col.title} className="border-b border-white/15 md:border-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenCol(open ? null : i)}
                  className="flex h-12 w-full items-center justify-between text-left text-[15px] font-bold text-white md:pointer-events-none md:mb-3 md:h-auto md:text-sm"
                >
                  {col.title}
                  <ChevronDown className={cn("h-4 w-4 transition md:hidden", open && "rotate-180")} aria-hidden />
                </button>
                <ul className={cn("space-y-3 pb-4 md:block md:space-y-2 md:pb-0", open ? "block" : "hidden")}>
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.href}`}>
                      <Link href={link.href} className="text-sm text-[#DCE6F5] transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {settings.newsletter_enabled ? (
          <div>
            <p className="mb-3 text-sm font-bold text-white">{settings.newsletter_title}</p>
            <p className="mb-3 text-sm">{settings.newsletter_placeholder}</p>
            <Link href={APP_ROUTES.member} className="inline-flex h-10 items-center rounded-full bg-[#FFD454] px-4 text-sm font-bold text-[#153E73]">
              訂閱／加入會員
            </Link>
          </div>
        ) : null}
      </DesktopContainer>
      <DesktopContainer className="flex flex-col gap-2 border-t border-white/15 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>{settings.copyright.replace("{year}", String(new Date().getFullYear()))}</span>
        {settings.bottom_links.length ? (
          <span className="flex flex-wrap gap-4">
            {settings.bottom_links.map((link) => (
              <Link key={`${link.label}-${link.href}`} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </span>
        ) : null}
      </DesktopContainer>
    </footer>
  );
}
