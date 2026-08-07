"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
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
  "/recipes": BookOpen,
  "/ai": Sparkles,
  "/member": User,
} as const;

/** 五欄底部導覽 — 首頁／商城／食譜（突出）／AI／我的 */
export function MobileBottomNav() {
  const pathname = usePathname();

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E9EDF2] bg-white/95 backdrop-blur-md md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "var(--header-height-mobile, 64px)",
        boxShadow: "0 -4px 16px rgba(21, 62, 115, 0.06)",
      }}
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {CONSUMER_BOTTOM_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;
          const featured = "featured" in item && item.featured;
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "brand-focus-ring flex h-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-bold transition",
                  featured && "-mt-3",
                  active || featured ? "text-[#153E73]" : "text-[#687386]"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center transition",
                    featured
                      ? cn(
                          "h-12 w-12 rounded-full border-2 border-white bg-[#FFE149] shadow-[0_6px_16px_rgba(21,62,115,0.18)]",
                          active && "ring-2 ring-[#153E73]/25"
                        )
                      : cn(
                          "h-8 w-8 rounded-full",
                          active && "bg-[#F16458]/10 text-[#F16458]"
                        )
                  )}
                >
                  <Icon
                    className={cn(featured ? "h-6 w-6" : "h-[22px] w-[22px]")}
                    strokeWidth={featured ? 2.25 : 1.75}
                    aria-hidden
                  />
                </span>
                <span
                  className={cn(
                    "max-w-full truncate",
                    featured && "text-[11px] font-extrabold tracking-wide"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
