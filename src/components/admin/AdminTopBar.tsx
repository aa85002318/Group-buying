"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";
import { useAdminShell } from "@/components/admin/AdminShell";
import { AdminMobileMenuButton } from "@/components/layout/AdminSidebar";

export function AdminTopBar() {
  const router = useRouter();
  const { profile } = useAdminShell();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(APP_ROUTES.login);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <AdminMobileMenuButton />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-coffee lg:hidden">管理後台</p>
          <p className="hidden truncate text-sm font-medium text-coffee lg:block">chimeidiy 管理後台</p>
          {profile && (
            <p className="truncate text-xs text-muted-foreground">
              {profile.full_name ?? "管理員"} · {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href={APP_ROUTES.staffPickupScan} className="hidden text-xs text-primary hover:underline sm:inline">
          門市掃碼
        </Link>
        <Link href={APP_ROUTES.home} className="text-xs text-muted-foreground hover:text-primary">
          前台
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={logout}>
          登出
        </Button>
      </div>
    </header>
  );
}
