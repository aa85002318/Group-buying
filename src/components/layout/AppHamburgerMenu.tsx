"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  Gift,
  Headphones,
  Heart,
  House,
  Lightbulb,
  MapPin,
  Menu,
  Settings,
  UserRound,
  Users,
  Wheat,
  ChefHat,
  X,
  type LucideIcon,
} from "lucide-react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import {
  DEFAULT_SIDE_MENU_SECTIONS,
  type SideMenuSection,
} from "@/lib/site-header";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { OPEN_SIDE_MENU_EVENT } from "@/lib/side-menu-events";
import { cn } from "@/lib/utils";

const LUCIDE_BY_HINT: Record<string, LucideIcon> = {
  house: House,
  home: House,
  bookopen: BookOpen,
  recipes: BookOpen,
  wheat: Wheat,
  materials: Wheat,
  chefhat: ChefHat,
  courses: ChefHat,
  gift: Gift,
  groupbuy: Gift,
  lightbulb: Lightbulb,
  users: Users,
  mappin: MapPin,
  headphones: Headphones,
  userround: UserRound,
  member: UserRound,
  clipboardlist: ClipboardList,
  orders: ClipboardList,
  heart: Heart,
  favorites: Heart,
  settings: Settings,
};

function iconForItem(item: { id: string; label: string; icon?: string }): LucideIcon {
  const key = String(item.icon || item.id || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (LUCIDE_BY_HINT[key]) return LUCIDE_BY_HINT[key];
  if (/食譜|recipe/.test(item.label)) return BookOpen;
  if (/材料|baking|shop/.test(item.label)) return Wheat;
  if (/課程|course/.test(item.label)) return ChefHat;
  if (/團購|group/.test(item.label)) return Gift;
  if (/門市|store|map/.test(item.label)) return MapPin;
  if (/客服|faq|support/.test(item.label)) return Headphones;
  if (/會員|member|profile/.test(item.label)) return UserRound;
  if (/訂單|order/.test(item.label)) return ClipboardList;
  if (/收藏|favorite/.test(item.label)) return Heart;
  if (/設定|setting/.test(item.label)) return Settings;
  if (/首頁|home/.test(item.label)) return House;
  return House;
}

function needsAuth(href: string): boolean {
  return (
    href.startsWith("/member") ||
    href.startsWith("/profile") ||
    href.startsWith("/orders") ||
    href.startsWith("/account")
  );
}

function resolveHref(href: string, loggedIn: boolean): string {
  if (!needsAuth(href) || loggedIn) return href;
  return `/auth/login?next=${encodeURIComponent(href)}`;
}

/** Consumer Hub hamburger — CMS side_menu_sections with safe fallback */
export function AppHamburgerMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sections, setSections] = useState<SideMenuSection[]>(() =>
    DEFAULT_SIDE_MENU_SECTIONS.filter(
      (s) => s.id === "services" || s.id === "support" || s.id === "member"
    )
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SIDE_MENU_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SIDE_MENU_EVENT, onOpen);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-header")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const cms = (d.sideMenuSections ?? d.side_menu_sections) as
          | SideMenuSection[]
          | undefined;
        if (Array.isArray(cms) && cms.length > 0) {
          setSections(
            cms
              .map((section) => ({
                ...section,
                items: (section.items ?? []).filter(
                  (item) =>
                    !/store-map|門市地圖/i.test(`${item.href} ${item.label}`)
                ),
              }))
              .filter((section) => (section.items?.length ?? 0) > 0)
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session?.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const initialExpanded = useMemo(() => {
    const map: Record<string, boolean> = {};
    sections.forEach((s) => {
      map[s.id] = true;
    });
    return map;
  }, [sections]);

  useEffect(() => {
    setExpanded(initialExpanded);
  }, [initialExpanded]);

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
            <div className="absolute bottom-3 left-3 top-3 flex w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] bg-surface shadow-lift">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
                <ChimeidiyLogo variant="sideMenu" href="/" />
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
                {sections.map((section) => {
                  const isOpen = expanded[section.id] !== false;
                  return (
                    <div key={section.id} className="pt-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-5 py-2 text-left"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [section.id]: !isOpen,
                          }))
                        }
                      >
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground-muted">
                          {section.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-foreground-muted transition",
                            isOpen ? "rotate-180" : ""
                          )}
                          aria-hidden
                        />
                      </button>
                      {isOpen ? (
                        <ul className="mt-1">
                          {section.items.map((item) => {
                            const Icon = iconForItem(item);
                            const href = resolveHref(item.href, loggedIn);
                            return (
                              <li key={item.id}>
                                <Link
                                  href={href}
                                  onClick={() => setOpen(false)}
                                  className="flex min-h-14 items-center gap-3 px-5 py-3 transition hover:bg-surface-soft active:bg-primary-soft"
                                >
                                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE8E2] text-[#FF6B5B]">
                                    <Icon className="h-4 w-4" aria-hidden />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block font-semibold text-foreground">
                                      {item.label}
                                    </span>
                                    {item.description ? (
                                      <span className="block text-xs text-foreground-secondary">
                                        {item.description}
                                      </span>
                                    ) : null}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
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
