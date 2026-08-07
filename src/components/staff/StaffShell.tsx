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
    return <div className="min-h-screen bg-[#F7F8FA]">{children}</div>;
  }

  const nav = [
    { href: APP_ROUTES.staffHome, label: "今日作業", match: (p: string) => p === "/staff" || p === "/staff/" },
    {
      href: APP_ROUTES.staffPickupScan,
      label: "掃碼取貨",
      match: (p: string) => p.startsWith("/staff/pickup"),
    },
    { href: "/admin/store", label: "協作中心", match: () => false },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="border-b border-[#E6E9EF] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#153E73]">門市取貨作業</p>
            {staff ? (
              <p className="text-xs text-[#687386]">
                {staff.full_name ?? staff.email} ·{" "}
                {ROLE_LABELS[staff.role as keyof typeof ROLE_LABELS] ?? staff.role}
                {staff.store?.name ? ` · ${staff.store.name}` : ""}
              </p>
            ) : (
              <p className="text-xs text-[#687386]">載入中…</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 py-0 text-[#687386]"
            onClick={logout}
          >
            登出
          </Button>
        </div>
        <nav className="mx-auto mt-3 flex max-w-lg gap-1">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold transition ${
                  active
                    ? "bg-[#FFE149] text-[#153E73]"
                    : "bg-[#F7F8FA] text-[#153E73]/80 hover:bg-[#FFFBEA]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
