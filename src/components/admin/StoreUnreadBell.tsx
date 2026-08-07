"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAdminShell } from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";

/**
 * Top-bar badge for store collaboration unread (cross-store + messages).
 * store_staff → /admin/store#notifications; admin/cs keep access to both.
 */
export function StoreUnreadBell() {
  const { profile } = useAdminShell();
  const [total, setTotal] = useState(0);
  const role = profile?.role;

  const load = useCallback(() => {
    if (role !== "admin" && role !== "store_staff") {
      setTotal(0);
      return;
    }
    fetch("/api/admin/store/notifications?counts=1")
      .then((r) => r.json())
      .then((d) => setTotal(Number(d.unread?.total ?? 0)))
      .catch(() => setTotal(0));
  }, [role]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, [load]);

  const href =
    role === "store_staff" || role === "admin"
      ? "/admin/store#notifications"
      : "/admin/notifications";

  const label =
    total > 0
      ? `${total > 99 ? "99+" : total} 則未讀協作通知`
      : role === "store_staff"
        ? "門市協作通知"
        : "通知";

  return (
    <Link
      href={href}
      className="admin-icon-btn relative"
      aria-label={label}
      title={label}
    >
      <Bell className="h-4 w-4" aria-hidden />
      {total > 0 ? (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C94C4C] px-0.5 text-[9px] font-bold text-white"
          )}
        >
          {total > 99 ? "99+" : total}
        </span>
      ) : null}
    </Link>
  );
}
