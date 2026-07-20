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
  },
  {
    href: "/categories",
    label: "分類",
    icon: Grid2X2,
    match: (p: string) => p.startsWith("/categories") || p.startsWith("/category"),
    showBadge: false,
  },
  {
    href: "/products?sort=newest",
    label: "今日上新",
    icon: PackagePlus,
    match: (p: string) => p.startsWith("/products"),
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
    href: APP_ROUTES.member,
    label: "我的",
    icon: User,
    match: (p: string) => p.startsWith("/profile") || p.startsWith("/member"),
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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E5E7EB] bg-white/95 shadow-[0_-6px_20px_rgba(32,33,36,0.06)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-[4.5rem] max-w-app grid-cols-5 items-center px-2 pb-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match, showBadge }) => {
          const active = match(pathname);
          const featured = label === "今日上新";
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] transition-all",
                featured &&
                  "-translate-y-4 justify-center rounded-full border-4 border-white bg-[linear-gradient(135deg,#E9285C_0%,#FF4D36_55%,#FF8300_100%)] text-white shadow-[0_10px_28px_rgba(233,40,92,0.48)]",
                featured && "mx-auto h-[62px] w-[62px]"
              )}
            >
              <span className="relative">
                <Icon
                  className={cn(
                    featured ? "h-5 w-5 text-white" : "h-5 w-5",
                    !featured && (active ? "text-[#E9285C]" : "text-[#6B7280]")
                  )}
                />
                {showBadge && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  featured
                    ? "text-[10px] font-black leading-none text-white"
                    : active
                      ? "font-bold text-[#E9285C]"
                      : "font-medium text-[#6B7280]"
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
