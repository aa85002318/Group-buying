"use client";

import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export function MemberPageHeader({ unreadCount = 0 }: { unreadCount?: number }) {
  const badge = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between bg-[#FFFEFA]/95 px-4 py-3 backdrop-blur-sm"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <h1 className="text-[22px] font-bold tracking-tight text-[#153E73]">我的</h1>
      <div className="flex items-center gap-1">
        <Link
          href={APP_ROUTES.memberSettings}
          aria-label="帳號設定"
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[#153E73] transition hover:bg-[#FFF5CC]"
        >
          <Settings className="h-5 w-5" strokeWidth={2} />
        </Link>
        <Link
          href={APP_ROUTES.memberNotifications}
          aria-label={badge ? `通知中心，${badge} 則未讀` : "通知中心"}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl text-[#153E73] transition hover:bg-[#FFF5CC]"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          {badge ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F16458] px-1 text-[10px] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
