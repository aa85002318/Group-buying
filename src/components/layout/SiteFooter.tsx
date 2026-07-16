"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import { FOOTER_SECTIONS, isMinimalChromePath } from "@/lib/navigation";
import { APP_ROUTES } from "@/lib/site-links";

export function SiteFooter() {
  const pathname = usePathname();
  if (isMinimalChromePath(pathname)) return null;

  return (
    <footer className="mt-10 border-t border-border bg-card/50 pb-24 pt-8 md:pb-8">
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Link href={APP_ROUTES.home} className="block hover:text-primary">
            <span className="font-bold text-coffee">{BRAND_NAME}</span>
            <span className="mt-0.5 block text-xs font-medium text-brand-orange">{BRAND_SUBTITLE}</span>
          </Link>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            精選團購好物，門市取貨方便安心。
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
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

      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND_NAME}
      </p>
    </footer>
  );
}
