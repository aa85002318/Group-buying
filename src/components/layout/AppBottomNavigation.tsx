"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Heart,
  House,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isMinimalChromePath } from "@/lib/navigation";
import { APP_ROUTES } from "@/lib/site-links";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    label: "首頁",
    href: APP_ROUTES.home,
    icon: House,
    match: (p) => p === "/",
  },
  {
    key: "shop",
    label: "商城",
    href: APP_ROUTES.shop,
    icon: ShoppingBag,
    match: (p) => p.startsWith("/shop") || p.startsWith("/products"),
  },
  {
    key: "recipes",
    label: "食譜",
    href: APP_ROUTES.recipes,
    icon: BookOpen,
    primary: true,
    match: (p) => p.startsWith("/recipes"),
  },
  {
    key: "favorites",
    label: "收藏",
    href: APP_ROUTES.memberFavorites,
    icon: Heart,
    match: (p) => p.startsWith("/member/favorites"),
  },
  {
    key: "member",
    label: "我的",
    href: APP_ROUTES.member,
    icon: UserRound,
    // Favorites checked first via array order + matchActive
    match: (p) =>
      (p.startsWith("/member") || p.startsWith("/profile")) &&
      !p.startsWith("/member/favorites"),
  },
];

function matchActive(pathname: string): string {
  // Favorites before member — order matters
  for (const item of NAV_ITEMS) {
    if (item.match(pathname)) return item.key;
  }
  return "";
}

function RecipeBadge({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className="absolute -right-[5px] -top-[5px] flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#F16458] px-1 text-[11px] font-bold leading-none text-white"
      aria-label={`${label} 則通知`}
    >
      {label}
    </span>
  );
}

/**
 * 全站手機底部快捷選單 — 首頁／商城／食譜（黃凸）／收藏／我的
 * 僅 <768px 顯示；桌面版隱藏。
 */
export function AppBottomNavigation({
  recipeBadgeCount = 0,
}: {
  recipeBadgeCount?: number;
}) {
  const pathname = usePathname();

  if (isMinimalChromePath(pathname)) return null;

  const activeKey = matchActive(pathname);

  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{
        background: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTop: "1px solid #F0ECE5",
        boxShadow: "0 -4px 20px rgba(21, 62, 115, 0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "calc(76px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <ul className="mx-auto grid h-[76px] w-full max-w-[var(--app-max-width,960px)] grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = activeKey === item.key;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <li key={item.key} className="relative flex h-full justify-center">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "absolute top-[-18px] flex w-[74px] min-h-[92px] flex-col items-center justify-center gap-[5px] rounded-[22px_22px_20px_20px] border border-[rgba(255,193,7,0.32)] text-[#153E73] transition-[box-shadow,filter,transform] duration-150 ease-out",
                    "bg-[linear-gradient(180deg,#FEE169_0%,#FFD454_100%)]",
                    "shadow-[0_8px_20px_rgba(21,62,115,0.16)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153E73] focus-visible:ring-offset-2",
                    "active:scale-[0.98]",
                    active &&
                      "shadow-[0_10px_24px_rgba(21,62,115,0.22)] brightness-[1.04]"
                  )}
                >
                  <span className="relative inline-flex">
                    <Icon
                      className="h-7 w-7 text-[#153E73]"
                      strokeWidth={2.3}
                      aria-hidden
                    />
                    <RecipeBadge count={recipeBadgeCount} />
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-bold tracking-[0.02em] text-[#153E73]">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.key} className="relative flex h-full items-stretch">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mx-auto flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153E73] focus-visible:ring-offset-2",
                  "hover:bg-[#FFF8D6] active:bg-[#FFF8D6]",
                  active ? "font-bold text-[#153E73]" : "font-medium text-[#555B61]"
                )}
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px]",
                    active ? "text-[#153E73]" : "text-[#555B61]"
                  )}
                  strokeWidth={active ? 2.25 : 1.85}
                  aria-hidden
                />
                <span
                  className={cn(
                    "whitespace-nowrap text-[12px] leading-none",
                    active ? "text-[#153E73]" : "text-[#5F6368]"
                  )}
                >
                  {item.label}
                </span>
                {active ? (
                  <span
                    className="mt-0.5 h-[3px] w-[18px] rounded-full bg-[#FEE169]"
                    aria-hidden
                  />
                ) : (
                  <span className="mt-0.5 h-[3px] w-[18px]" aria-hidden />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
