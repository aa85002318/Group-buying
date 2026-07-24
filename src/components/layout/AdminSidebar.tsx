"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminShell } from "@/components/admin/AdminShell";
import { APP_ROUTES } from "@/lib/site-links";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import type { AdminNavGroup, AdminNavItem } from "@/lib/admin/permissions";

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Exact-only hubs so children don't light up the parent item
  if (href === "/admin" || href === "/admin/store" || href === "/admin/recipes") {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

function groupContainsActivePath(group: AdminNavGroup, pathname: string): boolean {
  return group.items.some((item) => isNavItemActive(pathname, item.href));
}

function NavLink({
  href,
  label,
  pathname,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = isNavItemActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "block rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted",
        className
      )}
    >
      {label}
    </Link>
  );
}

function NavGroupSection({
  group,
  pathname,
  expanded,
  onToggle,
  onNavigate,
}: {
  group: AdminNavGroup;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  if (group.id === "dashboard" && group.items.length === 1) {
    const item = group.items[0];
    return (
      <NavLink
        href={item.href}
        label={item.label}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
          groupContainsActivePath(group, pathname)
            ? "text-primary"
            : "text-foreground hover:bg-muted"
        )}
      >
        <span>{group.label}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded && (
        <div className="ml-2 space-y-0.5 border-l border-border pl-2">
          {group.items.map((item: AdminNavItem) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const EXPANDED_STORAGE_KEY = "chimeidiy-admin-nav-expanded";

function readStoredExpanded(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function useExpandedGroups(navGroups: AdminNavGroup[], pathname: string) {
  const activeGroupIds = useMemo(
    () => navGroups.filter((g) => groupContainsActivePath(g, pathname)).map((g) => g.id),
    [navGroups, pathname]
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeGroupIds));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredExpanded();
    setExpanded((prev) => {
      const next = new Set<string>([
        ...Array.from(stored),
        ...Array.from(prev),
        ...activeGroupIds,
      ]);
      return next;
    });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of activeGroupIds) next.add(id);
      return next;
    });
  }, [activeGroupIds]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        EXPANDED_STORAGE_KEY,
        JSON.stringify(Array.from(expanded))
      );
    } catch {
      /* ignore */
    }
  }, [expanded, hydrated]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return { expanded, toggle };
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-2 border-t border-border p-3 text-xs">
      <Link
        href={APP_ROUTES.staffPickupScan}
        className="block text-primary hover:underline"
        onClick={onNavigate}
      >
        門市掃碼取貨
      </Link>
      <Link
        href={APP_ROUTES.home}
        className="block text-muted-foreground hover:text-primary"
        onClick={onNavigate}
      >
        ← 返回前台
      </Link>
    </div>
  );
}

function GroupedNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { navGroups } = useAdminShell();
  const { expanded, toggle } = useExpandedGroups(navGroups, pathname);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {navGroups.map((group) => (
        <NavGroupSection
          key={group.id}
          group={group}
          pathname={pathname}
          expanded={expanded.has(group.id)}
          onToggle={() => toggle(group.id)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

/** Desktop left sidebar */
export function AdminDesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="shrink-0 border-b border-border px-4 py-4">
          <Link href={APP_ROUTES.admin} className="text-lg font-bold text-primary">
            CHIMEIDIY 管理中心
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {BRAND_NAME} · {BRAND_SUBTITLE}
          </p>
        </div>
        <GroupedNav pathname={pathname} />
        <SidebarFooter />
      </div>
    </aside>
  );
}

/** Mobile slide-over navigation */
export function AdminMobileDrawer() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useAdminShell();

  if (!mobileNavOpen) return null;

  const close = () => setMobileNavOpen(false);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="關閉選單"
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />
      <aside className="absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col bg-card shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-bold text-primary">CHIMEIDIY 管理中心</p>
            <p className="text-xs text-muted-foreground">功能選單</p>
          </div>
          <button
            type="button"
            aria-label="關閉"
            className="rounded-lg p-2 hover:bg-muted"
            onClick={close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <GroupedNav pathname={pathname} onNavigate={close} />
        <SidebarFooter onNavigate={close} />
      </aside>
    </div>
  );
}

export function AdminMobileMenuButton() {
  const { setMobileNavOpen } = useAdminShell();
  return (
    <button
      type="button"
      aria-label="開啟選單"
      className="rounded-lg border border-border p-2 hover:bg-muted lg:hidden"
      onClick={() => setMobileNavOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
