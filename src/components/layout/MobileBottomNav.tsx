"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMinimalChromePath } from "@/lib/navigation";
import { CONSUMER_BOTTOM_NAV } from "@/lib/consumer-hub";
import { useCart } from "@/hooks/useCart";

const ICONS = {
  "/": Home,
  "/shop": LayoutGrid,
  "/group-buy": Users,
  "/cart": ShoppingCart,
  "/member": User,
} as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[960px] border-t border-border bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-14 min-h-[56px] grid-cols-5 items-center px-1">
        {CONSUMER_BOTTOM_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;
          const isGroup = item.accent === "groupBuy";
          const isCart = item.href === "/cart";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className="relative flex min-h-touch min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] transition-all"
            >
              <span className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active
                      ? isGroup
                        ? "text-groupBuy"
                        : "text-primary"
                      : "text-caramel"
                  )}
                  aria-hidden
                />
                {isCart && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  active
                    ? isGroup
                      ? "font-bold text-groupBuy"
                      : "font-bold text-primary"
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
