"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";

interface StaffInfo {
  full_name: string | null;
  email: string | null;
  role: string;
  store: { name: string; address?: string } | null;
}

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffInfo | null>(null);

  const isLoginPage = pathname === "/staff/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/staff/me")
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.replace(`/staff/login?next=${encodeURIComponent(pathname)}`);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.staff) setStaff(data.staff);
      })
      .catch(() => {});
  }, [isLoginPage, pathname, router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/staff/login");
  };

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-coffee">門市取貨系統</p>
            {staff ? (
              <p className="text-xs text-muted-foreground">
                {staff.full_name ?? staff.email} · {ROLE_LABELS[staff.role as keyof typeof ROLE_LABELS] ?? staff.role}
                {staff.store?.name ? ` · ${staff.store.name}` : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">載入中…</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
            <Link href={APP_ROUTES.staffPickupScan} className="text-primary hover:underline">
              掃碼取貨
            </Link>
            <Button type="button" variant="ghost" size="sm" className="h-auto px-0 py-0 text-muted-foreground" onClick={logout}>
              登出
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
