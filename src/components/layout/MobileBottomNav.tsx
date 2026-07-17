"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, Home, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMinimalChromePath } from "@/lib/navigation";
import { APP_ROUTES } from "@/lib/site-links";
import { useCart } from "@/hooks/useCart";

const NAV_ITEMS = [
  {
    href: APP_ROUTES.home,
    label: "首頁",
    icon: Home,
    match: (p: string) => p === "/",
    showBadge: false,
  },
  {
    href: "/categories",
    label: "分類",
    icon: Grid2X2,
    match: (p: string) => p.startsWith("/categories") || p.startsWith("/category"),
    showBadge: false,
  },
  {
    href: APP_ROUTES.cart,
    label: "購物車",
    icon: ShoppingCart,
    match: (p: string) => p.startsWith("/cart"),
    showBadge: true,
  },
  {
    href: APP_ROUTES.profile,
    label: "我的",
    icon: User,
    match: (p: string) => p.startsWith("/profile"),
    showBadge: false,
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-[4.25rem] max-w-app grid-cols-4 items-center px-2 pb-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match, showBadge }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex min-w-0 flex-col items-center gap-0.5 py-1 text-[11px] transition-colors"
            >
              <span className="relative">
                <Icon className={cn("h-5 w-5", active ? "text-nav-active" : "text-nav-icon")} />
                {showBadge && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span className={cn(active ? "font-semibold text-nav-active" : "text-nav-inactive")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
