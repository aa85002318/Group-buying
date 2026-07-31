"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

/** Hero notification — uses shared /notifications route; unread from member summary when available. */
export const NotificationButton = memo(function NotificationButton({
  className,
}: {
  className?: string;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/summary", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const n = Number(d.unreadNotifications ?? d.unread_notifications ?? 0);
        if (Number.isFinite(n) && n > 0) setUnreadCount(n);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    unreadCount > 0
      ? `${unreadCount > 99 ? "99+" : unreadCount} 則未讀通知`
      : "查看最新通知";

  return (
    <Link
      href={APP_ROUTES.notifications}
      className={className}
      aria-label={label}
    >
      <Bell className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
      {unreadCount > 0 ? (
        unreadCount < 100 ? (
          <span className="hero-action-badge hero-action-badge--count" aria-hidden>
            {unreadCount}
          </span>
        ) : (
          <span className="hero-action-badge hero-action-badge--dot" aria-hidden />
        )
      ) : null}
    </Link>
  );
});
