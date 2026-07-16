"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import {
  FOOTER_SECTIONS,
  FOOTER_STAFF_SECTION,
  isMinimalChromePath,
} from "@/lib/navigation";
import { APP_ROUTES } from "@/lib/site-links";
import { isSupabaseConfigured } from "@/lib/config";

export function SiteFooter() {
  const pathname = usePathname();
  const [showStaffLinks, setShowStaffLinks] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const role = data.profile?.role as string | undefined;
        setShowStaffLinks(role === "admin" || role === "store_staff");
      })
      .catch(() => {
        if (!cancelled) setShowStaffLinks(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isMinimalChromePath(pathname)) return null;

  const sections = showStaffLinks
    ? [...FOOTER_SECTIONS, FOOTER_STAFF_SECTION]
    : FOOTER_SECTIONS;

  return (
    <footer className="mt-10 border-t border-border bg-card/50 pb-24 pt-8 md:pb-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href={APP_ROUTES.home} className="block hover:text-primary">
            <span className="font-bold text-coffee">{BRAND_NAME}</span>
            <span className="mt-0.5 block text-xs font-medium text-brand-orange">
              {BRAND_SUBTITLE}
            </span>
          </Link>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            精選團購好物，門市取貨方便安心。
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-3 text-sm font-medium text-coffee">{section.title}</p>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border/60 pt-6 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
        <span aria-hidden className="hidden sm:inline">
          ·
        </span>
        <Link href={APP_ROUTES.privacy} className="hover:text-primary">
          隱私權政策
        </Link>
        <span aria-hidden>·</span>
        <Link href={APP_ROUTES.terms} className="hover:text-primary">
          服務條款
        </Link>
      </div>
    </footer>
  );
}
