"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Newspaper,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn, ROLE_LABELS } from "@/lib/utils";
import { useAdminShell } from "@/components/admin/AdminShell";
import { APP_ROUTES } from "@/lib/site-links";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import {
  isAdminNavLinkItem,
  type AdminNavGroup,
  type AdminNavItem,
} from "@/lib/admin/permissions";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Package,
  Users,
  BookOpen,
  LayoutTemplate,
  Newspaper,
  Boxes,
  Settings,
};

const EXPANDED_STORAGE_KEY = "chimeidiy-admin-nav-expanded-v3";
const COLLAPSED_STORAGE_KEY = "chimeidiy-admin-sidebar-collapsed";
const SIDEBAR_EXPANDED_WIDTH = "240px";
const SIDEBAR_COLLAPSED_WIDTH = "72px";

function pathnameMatchesHref(pathname: string, href: string): boolean {
  const pathOnly = (href.split("?")[0] || href).split("#")[0] || href;
  if (pathname === pathOnly) return true;
  // Exact-only hubs so children don't light up the parent incorrectly
  if (
    pathOnly === "/admin" ||
    pathOnly === "/admin/store" ||
    pathOnly === "/admin/recipes" ||
    pathOnly === "/admin/group-buy"
  ) {
    return false;
  }
  // Shop hub highlights for all /admin/shop/*
  if (pathOnly === "/admin/shop") {
    return pathname === "/admin/shop" || pathname.startsWith("/admin/shop/");
  }
  return pathname.startsWith(`${pathOnly}/`);
}

function isNavItemActive(pathname: string, href: string): boolean {
  return pathnameMatchesHref(pathname, href);
}

function groupContainsActivePath(group: AdminNavGroup, pathname: string): boolean {
  return group.items.some(
    (item) => isAdminNavLinkItem(item) && isNavItemActive(pathname, item.href)
  );
}

function GroupIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || LayoutDashboard;
  return <Icon className={cn("h-4 w-4 shrink-0", className)} aria-hidden />;
}

function AdminRoleBadge({ role }: { role?: string | null }) {
  if (!role) return null;
  const label = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
  return (
    <span className="inline-flex rounded-md bg-[#FFF5C7] px-1.5 py-0.5 text-[11px] font-semibold text-[#153E73]">
      {label}
    </span>
  );
}

function AdminNavItemLink({
  item,
  pathname,
  onNavigate,
  collapsed,
}: {
  item: AdminNavItem & { href: string };
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const active = isNavItemActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] transition-colors",
        active
          ? "bg-[var(--admin-active,#FFF5C7)] font-semibold text-[var(--admin-title,#153E73)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[5px] before:rounded-r before:bg-[#FFE149]"
          : "text-[var(--admin-title,#153E73)]/85 hover:bg-[var(--admin-sidebar-hover,#FFF4B5)]",
        collapsed && "justify-center px-2"
      )}
    >
      {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
      {item.badge && !collapsed ? (
        <span className="ml-auto rounded bg-[#FFE149]/40 px-1.5 text-[10px] font-bold text-[#153E73]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function AdminNavGroupSection({
  group,
  pathname,
  expanded,
  onToggle,
  onNavigate,
  collapsed,
}: {
  group: AdminNavGroup;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const hasActive = groupContainsActivePath(group, pathname);

  if (group.id === "dashboard" && group.items.length === 1 && isAdminNavLinkItem(group.items[0]!)) {
    const item = group.items[0]!;
    if (collapsed) {
      return (
        <Link
          href={item.href}
          onClick={onNavigate}
          title={item.label}
          className={cn(
            "relative flex items-center justify-center rounded-lg p-2.5 transition-colors",
            isNavItemActive(pathname, item.href)
              ? "bg-[var(--admin-active,#FFF5C7)] text-[var(--admin-title,#153E73)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[5px] before:rounded-r before:bg-[#FFE149]"
              : "text-[var(--admin-title,#153E73)]/80 hover:bg-[var(--admin-sidebar-hover,#FFF4B5)]"
          )}
        >
          <GroupIcon name={group.icon || item.icon} />
        </Link>
      );
    }
    return (
      <AdminNavItemLink item={item} pathname={pathname} onNavigate={onNavigate} />
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        title={group.label}
        onClick={onToggle}
        className={cn(
          "relative flex w-full items-center justify-center rounded-lg p-2.5 transition-colors",
          hasActive
            ? "bg-[var(--admin-active,#FFF5C7)] text-[var(--admin-title,#153E73)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[5px] before:rounded-r before:bg-[#FFE149]"
            : "text-[var(--admin-title,#153E73)]/80 hover:bg-[var(--admin-sidebar-hover,#FFF4B5)]"
        )}
      >
        <GroupIcon name={group.icon} />
      </button>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors",
          hasActive
            ? "bg-[var(--admin-active,#FFF5C7)] text-[var(--admin-title,#153E73)]"
            : "text-[var(--admin-title,#153E73)]/80 hover:bg-[var(--admin-sidebar-hover,#FFF4B5)]"
        )}
      >
        <GroupIcon name={group.icon} className="text-[var(--admin-title,#153E73)]" />
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--admin-muted,#8A94A6)] transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded ? (
        <div className="ml-2 space-y-0.5 border-l-2 border-[#FFE149]/50 pl-2">
          {group.items.map((item, idx) => {
            if (item.type === "heading") {
              return (
                <p
                  key={`heading-${group.id}-${item.label}-${idx}`}
                  className="px-3 pb-0.5 pt-2.5 text-[11px] font-bold tracking-wide text-[#153E73]/45"
                >
                  {item.label}
                </p>
              );
            }
            if (!isAdminNavLinkItem(item)) return null;
            return (
              <AdminNavItemLink
                key={`${item.href}-${item.label}`}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function readStoredExpandedId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return null;
    // v3 stores a single group id; tolerate legacy JSON array
    if (raw.startsWith("[")) {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) && parsed[0] ? parsed[0] : null;
    }
    return raw || null;
  } catch {
    return null;
  }
}

/** Accordion: only one primary group open at a time (active route always preferred). */
function useExpandedGroups(navGroups: AdminNavGroup[], pathname: string) {
  const activeGroupId = useMemo(() => {
    const active = navGroups.find((g) => groupContainsActivePath(g, pathname));
    return active?.id ?? navGroups[0]?.id ?? null;
  }, [navGroups, pathname]);

  const [expandedId, setExpandedId] = useState<string | null>(activeGroupId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredExpandedId();
    if (activeGroupId) {
      setExpandedId(activeGroupId);
    } else if (stored && navGroups.some((g) => g.id === stored)) {
      setExpandedId(stored);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeGroupId) setExpandedId(activeGroupId);
  }, [activeGroupId]);

  useEffect(() => {
    if (!hydrated || !expandedId) return;
    try {
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, expandedId);
    } catch {
      /* ignore */
    }
  }, [expandedId, hydrated]);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const expanded = useMemo(
    () => new Set(expandedId ? [expandedId] : []),
    [expandedId]
  );

  return { expanded, toggle };
}

function AdminSidebarFooter({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { profile } = useAdminShell();

  return (
    <div className="shrink-0 space-y-2 border-t border-[#E8EBF0] p-3 text-xs">
      {!collapsed ? (
        <div className="space-y-1">
          <p className="truncate text-[13px] font-semibold text-[#153E73]">
            {profile?.full_name ?? "管理員"}
          </p>
          <AdminRoleBadge role={profile?.role} />
        </div>
      ) : null}
      <Link
        href={APP_ROUTES.staffPickupScan}
        className={cn(
          "block text-[#153E73] hover:underline",
          collapsed && "truncate text-center text-[10px]"
        )}
        onClick={onNavigate}
        title="門市掃碼取貨"
      >
        {collapsed ? "掃碼" : "門市掃碼取貨"}
      </Link>
      <Link
        href={APP_ROUTES.home}
        className={cn(
          "block text-muted-foreground hover:text-[#153E73]",
          collapsed && "truncate text-center text-[10px]"
        )}
        onClick={onNavigate}
        title="返回前台"
      >
        {collapsed ? "前台" : "← 返回前台"}
      </Link>
    </div>
  );
}

function GroupedNav({
  pathname,
  onNavigate,
  collapsed,
}: {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { navGroups } = useAdminShell();
  const { expanded, toggle } = useExpandedGroups(navGroups, pathname);

  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
      {navGroups.map((group) => (
        <AdminNavGroupSection
          key={group.id}
          group={group}
          pathname={pathname}
          expanded={expanded.has(group.id)}
          onToggle={() => toggle(group.id)}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      ))}
    </nav>
  );
}

function SidebarBrand({
  collapsed,
  extra,
}: {
  collapsed?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[#E8EBF0] bg-white px-3 py-3">
      <Link href={APP_ROUTES.admin} className="min-w-0">
        {collapsed ? (
          <span className="block text-center text-sm font-bold text-[#153E73]">CM</span>
        ) : (
          <>
            <p className="text-[15px] font-bold leading-tight text-[#153E73]">
              CHIMEIDIY 管理中心
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {BRAND_NAME} · {BRAND_SUBTITLE}
            </p>
          </>
        )}
      </Link>
      {extra}
    </div>
  );
}

/** Desktop left sidebar — fixed 252 / 72 */
export function AdminDesktopSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH
    );
  }, [collapsed, hydrated]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH
    );
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-[100dvh] shrink-0 flex-col border-r border-[var(--admin-border,#ECECEC)] bg-white lg:flex",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <SidebarBrand
        collapsed={collapsed}
        extra={
          <button
            type="button"
            aria-label={collapsed ? "展開側欄" : "收合側欄"}
            className="rounded-xl p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-sidebar-hover,#FFF4B5)] hover:text-[var(--admin-title)]"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        }
      />
      <GroupedNav pathname={pathname} collapsed={collapsed} />
      <AdminSidebarFooter collapsed={collapsed} />
    </aside>
  );
}

/** Mobile / tablet slide-over drawer */
export function AdminMobileDrawer() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useAdminShell();

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen, setMobileNavOpen]);

  // Close drawer when route changes (e.g. browser back)
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  if (!mobileNavOpen) return null;

  const close = () => setMobileNavOpen(false);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="管理選單">
      <button
        type="button"
        aria-label="關閉選單"
        className="absolute inset-0 bg-[rgba(15,23,42,0.38)]"
        onClick={close}
      />
      <aside className="absolute left-0 top-0 flex h-[100dvh] w-[min(88vw,300px)] max-w-full flex-col overflow-hidden bg-white shadow-xl">
        <SidebarBrand
          extra={
            <button
              type="button"
              aria-label="關閉"
              className="rounded-lg p-2 hover:bg-[#FFFBEA]"
              onClick={close}
            >
              <X className="h-5 w-5 text-[#153E73]" />
            </button>
          }
        />
        <GroupedNav pathname={pathname} onNavigate={close} />
        <AdminSidebarFooter onNavigate={close} />
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
      className="admin-icon-btn lg:hidden"
      onClick={() => setMobileNavOpen(true)}
    >
      <Menu className="h-5 w-5" aria-hidden />
    </button>
  );
}
