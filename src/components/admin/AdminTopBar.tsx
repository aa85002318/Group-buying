"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LogOut,
  Search,
  Store,
  UserRound,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";
import { useAdminShell } from "@/components/admin/AdminShell";
import { AdminMobileMenuButton } from "@/components/layout/AdminSidebar";
import {
  ADMIN_NAV_GROUPS,
  isAdminNavLinkItem,
} from "@/lib/admin/permissions";

function useAdminBreadcrumbs(pathname: string) {
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "管理中心", href: "/admin" },
  ];
  if (pathname === "/admin" || pathname === "/admin/") {
    crumbs.push({ label: "今日營運" });
    return crumbs;
  }

  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (!isAdminNavLinkItem(item)) continue;
      const pathOnly = (item.href.split("?")[0] || item.href).split("#")[0] || item.href;
      if (
        pathname === pathOnly ||
        (pathOnly !== "/admin" && pathname.startsWith(`${pathOnly}/`))
      ) {
        crumbs.push({ label: group.label });
        crumbs.push({ label: item.label, href: item.href });
        return crumbs;
      }
    }
  }

  crumbs.push({ label: "目前頁面" });
  return crumbs;
}

export function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAdminShell();
  const crumbs = useAdminBreadcrumbs(pathname);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(APP_ROUTES.login);
  };

  return (
    <header
      className="sticky top-0 z-40 flex shrink-0 items-center border-b border-[var(--admin-border,#ECECEC)] bg-[rgba(255,255,255,0.96)] px-3 backdrop-blur-md md:px-6"
      style={{ height: "var(--admin-header-h, 72px)" }}
    >
      <div className="flex w-full min-w-0 items-center gap-2 md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <AdminMobileMenuButton />

          <Link
            href="/admin/stores"
            className="admin-icon-btn hidden sm:inline-flex"
            aria-label="門市切換"
            title="門市列表"
          >
            <Store className="h-4 w-4" aria-hidden />
          </Link>

          <nav aria-label="麵包屑" className="hidden min-w-0 items-center gap-1 md:flex">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                {i > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--admin-muted)]" aria-hidden />
                ) : null}
                {c.href && i < crumbs.length - 1 ? (
                  <Link
                    href={c.href}
                    className="truncate text-sm font-medium text-[var(--admin-muted)] hover:text-[var(--admin-title)]"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate text-sm font-bold text-[var(--admin-title)]">
                    {c.label}
                  </span>
                )}
              </span>
            ))}
          </nav>

          <p className="truncate text-sm font-bold text-[var(--admin-title)] md:hidden">
            {crumbs[crumbs.length - 1]?.label ?? "管理後台"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <Link
            href="/admin/notifications"
            className="admin-icon-btn"
            aria-label="通知"
            title="通知管理"
          >
            <Bell className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/admin/products"
            className="admin-icon-btn"
            aria-label="快速搜尋商品"
            title="商品主檔搜尋"
          >
            <Search className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/admin/stores"
            className="hidden h-10 items-center gap-1.5 rounded-[14px] border border-[var(--admin-border)] bg-white px-3 text-xs font-semibold text-[var(--admin-title)] hover:bg-[var(--admin-hover)] sm:inline-flex"
            aria-label="店別"
          >
            <Store className="h-3.5 w-3.5" aria-hidden />
            店別
          </Link>
          <div className="hidden h-10 max-w-[160px] items-center gap-2 rounded-[14px] border border-[var(--admin-border)] bg-white px-3 lg:flex">
            <UserRound className="h-4 w-4 shrink-0 text-[var(--admin-title)]" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[var(--admin-title)]">
                {profile?.full_name ?? "管理員"}
              </p>
              <p className="truncate text-[10px] text-[var(--admin-muted)]">
                {ROLE_LABELS[profile?.role as keyof typeof ROLE_LABELS] ?? profile?.role ?? ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="admin-icon-btn"
            aria-label="登出"
            title="登出"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
