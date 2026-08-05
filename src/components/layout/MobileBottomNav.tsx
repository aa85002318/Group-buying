"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Gift,
  Heart,
  Home,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isMinimalChromePath } from "@/lib/navigation";
import { CONSUMER_BOTTOM_NAV } from "@/lib/consumer-hub";

const ICONS = {
  "/": Home,
  "/shop": ShoppingBag,
  "/group-buy": Gift,
  "/recipes": BookOpen,
  "/member/favorites": Heart,
  "/ai": Sparkles,
  "/member": User,
} as const;

const RECIPES_BOTTOM_NAV = [
  { href: "/", label: "首頁", match: (p: string) => p === "/" },
  {
    href: "/shop",
    label: "商城",
    match: (p: string) => p.startsWith("/shop") || p.startsWith("/products") || p.startsWith("/categories"),
  },
  {
    href: "/recipes",
    label: "食譜圖書館",
    match: (p: string) => p.startsWith("/recipes"),
  },
  {
    href: "/member/favorites",
    label: "收藏",
    match: (p: string) => p.startsWith("/member/favorites"),
  },
  {
    href: "/member",
    label: "我的",
    match: (p: string) => p.startsWith("/member") || p.startsWith("/profile"),
  },
] as const;

/** 五欄底部導覽 — 首頁／商城／團購／AI／我的 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const isRecipesHub =
    pathname === "/recipes" || pathname === "/recipes/" || pathname.startsWith("/recipes?");
  const items = isRecipesHub ? RECIPES_BOTTOM_NAV : CONSUMER_BOTTOM_NAV;

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E9EDF2] bg-[rgba(255,255,255,0.96)] backdrop-blur-md"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "var(--header-height-mobile, 64px)",
        boxShadow: "0 -4px 16px rgba(21, 62, 115, 0.06)",
      }}
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "brand-focus-ring flex h-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-bold transition",
                  active
                    ? isRecipesHub
                      ? "text-[#153E73]"
                      : "text-[#F16458]"
                    : "text-[#687386]"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full",
                    active && (isRecipesHub ? "bg-[#FEE169]" : "bg-[#F16458]/10")
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
