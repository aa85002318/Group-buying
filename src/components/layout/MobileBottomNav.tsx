"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
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
  "/baking-materials": ShoppingBag,
  "/group-buy": Gift,
  "/ai": Sparkles,
  "/member": User,
} as const;

/** 五欄底部導覽 — 首頁／商城／團購／AI／我的 */
export function MobileBottomNav() {
  const pathname = usePathname();

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[var(--app-max-width)] -translate-x-1/2 border-t border-[var(--brand-border,#F2E7DF)] bg-[var(--brand-surface,#fff)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "var(--header-height-mobile, 64px)",
      }}
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {CONSUMER_BOTTOM_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "brand-focus-ring flex h-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-bold transition",
                  active
                    ? "text-[var(--brand-primary,#FF6B5B)]"
                    : "text-[var(--brand-text-secondary,#6D5C53)]"
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
