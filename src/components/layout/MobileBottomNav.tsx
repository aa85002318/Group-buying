"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, ShoppingBag, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMinimalChromePath } from "@/lib/navigation";
import { CONSUMER_BOTTOM_NAV } from "@/lib/consumer-hub";

const ICONS = {
  "/": Home,
  "/shop": ShoppingBag,
  "/group-buy": Users,
  "/ai-tools": Bot,
  "/member": User,
} as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[var(--app-max-width)] -translate-x-1/2 border-t border-divider bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto grid h-[60px] min-h-[56px] grid-cols-5 items-stretch px-0.5 sm:px-1">
        {CONSUMER_BOTTOM_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className="relative flex min-h-[44px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] sm:text-[11px]"
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-brand-primary" : "text-brand-caramel"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "max-w-full truncate",
                  active
                    ? "font-bold text-brand-primary"
                    : "font-medium text-foreground-secondary"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
