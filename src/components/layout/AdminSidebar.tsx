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

const EXPANDED_STORAGE_KEY = "chimeidiy-admin-nav-expanded-v2";
const COLLAPSED_STORAGE_KEY = "chimeidiy-admin-sidebar-collapsed";

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
          ? "bg-[#FFF5C7] font-semibold text-[#153E73] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-[#FFE149]"
          : "text-[#153E73]/85 hover:bg-[#FFFBEA]",
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
              ? "bg-[#FFF5C7] text-[#153E73] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-[#FFE149]"
              : "text-[#153E73]/80 hover:bg-[#FFFBEA]"
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
            ? "bg-[#FFF5C7] text-[#153E73] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-[#FFE149]"
            : "text-[#153E73]/80 hover:bg-[#FFFBEA]"
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
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] font-semibold transition-colors",
          hasActive ? "text-[#153E73]" : "text-[#153E73]/80 hover:bg-[#FFFBEA]"
        )}
      >
        <GroupIcon name={group.icon} className="text-[#153E73]/70" />
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#153E73]/50 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded ? (
        <div className="ml-2 space-y-0.5 border-l border-[#E8EBF0] pl-2">
          {group.items.map((item, idx) => {
            if (item.type === "heading") {
              return (
                <p
                  key={`heading-${group.id}-${item.label}-${idx}`}
                  className="px-3 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-wide text-[#153E73]/45"
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
    // Default: only active groups (+ any previously stored that user opened)
    setExpanded((prev) => {
      const next = new Set<string>();
      for (const id of activeGroupIds) next.add(id);
      Array.from(stored).forEach((id) => {
        if (navGroups.some((g) => g.id === id)) next.add(id);
      });
      Array.from(prev).forEach((id) => {
        if (activeGroupIds.includes(id)) next.add(id);
      });
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
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(Array.from(expanded)));
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
      collapsed ? "72px" : "252px"
    );
  }, [collapsed, hydrated]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      collapsed ? "72px" : "252px"
    );
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-[100dvh] shrink-0 flex-col border-r border-[#E8EBF0] bg-white lg:flex",
        collapsed ? "w-[72px]" : "w-[252px]"
      )}
    >
      <SidebarBrand
        collapsed={collapsed}
        extra={
          <button
            type="button"
            aria-label={collapsed ? "展開側欄" : "收合側欄"}
            className="rounded-md p-1.5 text-[#153E73]/60 hover:bg-[#FFFBEA] hover:text-[#153E73]"
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, setMobileNavOpen]);

  if (!mobileNavOpen) return null;

  const close = () => setMobileNavOpen(false);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="關閉選單"
        className="absolute inset-0 bg-[rgba(15,23,42,0.38)]"
        onClick={close}
      />
      <aside className="absolute left-0 top-0 flex h-[100dvh] w-[min(88vw,330px)] max-w-full flex-col overflow-hidden bg-white shadow-xl">
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
      className="rounded-lg border border-[#E8EBF0] p-2 hover:bg-[#FFFBEA] lg:hidden"
      onClick={() => setMobileNavOpen(true)}
    >
      <Menu className="h-5 w-5 text-[#153E73]" />
    </button>
  );
}
