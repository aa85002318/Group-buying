"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, Home, PackagePlus, ShoppingCart, User } from "lucide-react";
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
    accent: "primary" as const,
  },
  {
    href: "/categories",
    label: "分類",
    icon: Grid2X2,
    match: (p: string) => p.startsWith("/categories") || p.startsWith("/category"),
    showBadge: false,
    accent: "primary" as const,
  },
  {
    href: "/products?sort=newest",
    label: "今日上新",
    icon: PackagePlus,
    match: (p: string) => p.startsWith("/products"),
    showBadge: false,
    accent: "groupBuy" as const,
  },
  {
    href: APP_ROUTES.cart,
    label: "購物車",
    icon: ShoppingCart,
    match: (p: string) => p.startsWith("/cart"),
    showBadge: true,
    accent: "primary" as const,
  },
  {
    href: APP_ROUTES.member,
    label: "我的",
    icon: User,
    match: (p: string) => p.startsWith("/profile") || p.startsWith("/member"),
    showBadge: false,
    accent: "primary" as const,
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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-[4.5rem] max-w-app grid-cols-5 items-center px-2 pb-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match, showBadge, accent }) => {
          const active = match(pathname);
          const activeClass =
            accent === "groupBuy" ? "text-groupBuy font-bold" : "text-primary font-bold";
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className="relative flex min-h-touch min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] transition-all"
            >
              <span className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? (accent === "groupBuy" ? "text-groupBuy" : "text-primary") : "text-foreground-secondary"
                  )}
                  aria-hidden
                />
                {showBadge && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  active ? activeClass : "font-medium text-foreground-secondary"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
