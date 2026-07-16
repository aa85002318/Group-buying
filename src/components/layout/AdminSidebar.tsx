"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminShell } from "@/components/admin/AdminShell";
import { APP_ROUTES } from "@/lib/site-links";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";

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
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
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

/** Desktop left sidebar */
export function AdminDesktopSidebar() {
  const pathname = usePathname();
  const { nav } = useAdminShell();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-border px-4 py-4">
          <Link href={APP_ROUTES.admin} className="text-lg font-bold text-primary">
            管理後台
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{BRAND_NAME} · {BRAND_SUBTITLE}</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} pathname={pathname} />
          ))}
        </nav>
        <div className="space-y-2 border-t border-border p-3 text-xs">
          <Link href={APP_ROUTES.staffPickupScan} className="block text-primary hover:underline">
            門市掃碼取貨
          </Link>
          <Link href={APP_ROUTES.home} className="block text-muted-foreground hover:text-primary">
            ← 返回前台
          </Link>
        </div>
      </div>
    </aside>
  );
}

/** Mobile slide-over navigation */
export function AdminMobileDrawer() {
  const pathname = usePathname();
  const { nav, mobileNavOpen, setMobileNavOpen } = useAdminShell();

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
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-bold text-primary">管理後台</p>
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} pathname={pathname} onNavigate={close} />
          ))}
        </nav>
        <div className="space-y-2 border-t border-border p-3 text-xs">
          <Link href={APP_ROUTES.staffPickupScan} className="block text-primary hover:underline" onClick={close}>
            門市掃碼取貨
          </Link>
          <Link href={APP_ROUTES.home} className="block text-muted-foreground hover:text-primary" onClick={close}>
            ← 返回前台
          </Link>
        </div>
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
