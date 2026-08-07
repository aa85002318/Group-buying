"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { sideMenuAuthHref } from "@/lib/navigation/side-menu-routes";

export function SideMenuMemberCard({
  loggedIn,
  name,
  avatarUrl,
  onNavigate,
}: {
  loggedIn: boolean;
  name?: string | null;
  avatarUrl?: string | null;
  onNavigate: () => void;
}) {
  if (!loggedIn) {
    return (
      <div className="mx-4 mt-3 rounded-2xl bg-[#FFD454] px-4 py-4">
        <p className="text-sm font-medium text-[#153E73]/80">尚未登入</p>
        <Link
          href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.member)}`}
          onClick={onNavigate}
          className="mt-3 inline-flex h-11 items-center justify-center rounded-2xl bg-[#153E73] px-4 text-sm font-bold text-white"
        >
          登入／註冊
        </Link>
      </div>
    );
  }

  const href = sideMenuAuthHref(APP_ROUTES.member, true);
  const initial = name?.trim()?.[0] || "?";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-[#FFD454] px-4 py-3"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-12 w-12 rounded-full border-2 border-white/70 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#153E73] text-lg font-bold text-white">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[#153E73]">{name || "會員"}</p>
        <p className="text-sm text-[#153E73]/80">會員中心</p>
      </div>
      <ChevronRight className="h-5 w-5 text-[#153E73]" />
    </Link>
  );
}
