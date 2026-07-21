"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Home, ShoppingBag, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMinimalChromePath } from "@/lib/navigation";
import { CONSUMER_BOTTOM_NAV } from "@/lib/consumer-hub";

const ICONS = {
  "/": Home,
  "/shop": ShoppingBag,
  "/group-buy": Users,
  "/recipes": ChefHat,
  "/member": User,
} as const;

/** 方案二：五等分、同高 80px、無凸起 Floating Button */
export function MobileBottomNav() {
  const pathname = usePathname();

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[var(--app-max-width)] -translate-x-1/2 border-t border-[var(--header-border)] bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto grid h-20 grid-cols-5 items-stretch px-0.5">
        {CONSUMER_BOTTOM_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className="relative flex min-h-[44px] min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition duration-200 active:scale-[0.98]"
            >
              <Icon
                className={cn(
                  "h-6 w-6 shrink-0 transition duration-200",
                  active
                    ? "scale-105 text-brand-primary"
                    : "text-[var(--nav-inactive)]"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "max-w-full truncate text-xs leading-none",
                  active
                    ? "font-medium text-brand-primary"
                    : "font-medium text-[var(--nav-inactive)]"
                )}
              >
                {item.label}
              </span>
              {active ? (
                <span
                  className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
