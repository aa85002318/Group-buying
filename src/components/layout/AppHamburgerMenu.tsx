"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import {
  DEFAULT_SIDE_MENU_SECTIONS,
  type SideMenuSection,
} from "@/lib/site-header";
import { cn } from "@/lib/utils";

/** Consumer Hub hamburger — 主要服務／支援／會員 */
export function AppHamburgerMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sections: SideMenuSection[] = DEFAULT_SIDE_MENU_SECTIONS.filter(
    (s) => s.id === "services" || s.id === "support" || s.id === "member"
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const panel =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="選單">
            <button
              type="button"
              className="absolute inset-0 bg-[rgba(74,53,42,0.45)]"
              aria-label="關閉選單"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute bottom-3 left-3 top-3 flex w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] bg-surface shadow-lift"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
                <ChimeidiyLogo variant="compact" href="/" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-caramel hover:bg-caramel-soft"
                  aria-label="關閉"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
                {sections.map((section) => (
                  <div key={section.id} className="pt-4">
                    <p className="px-5 text-xs font-bold uppercase tracking-wide text-foreground-muted">
                      {section.title}
                    </p>
                    <ul className="mt-1">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="flex min-h-14 items-center gap-3 px-5 py-3 transition hover:bg-surface-soft active:bg-primary-soft"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-foreground">{item.label}</span>
                              {item.description && (
                                <span className="block text-xs text-foreground-secondary">
                                  {item.description}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          className
        )}
        aria-label="開啟選單"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      {panel}
    </>
  );
}
