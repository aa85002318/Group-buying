"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Search, ShoppingCart, UserRound } from "lucide-react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { useCart } from "@/hooks/useCart";
import { DESKTOP_NAV_LINKS } from "@/lib/features/desktop-v2";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function DesktopHeader() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#EDE6DC] bg-[var(--cream,#FFFDF9)]"
      style={{ maxHeight: 84 }}
    >
      <DesktopContainer className="flex h-[76px] items-center gap-6">
        <ChimeidiyLogo variant="header" className="shrink-0 !w-[148px]" />

        <nav aria-label="桌機主選單" className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {DESKTOP_NAV_LINKS.map((link) => {
              const active = navActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-[15px] font-semibold tracking-wide transition-colors",
                      active
                        ? "text-[#153E73]"
                        : "text-[#5E4035] hover:text-[#153E73]"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Link
            href={APP_ROUTES.search}
            aria-label="搜尋"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5E4035] hover:bg-[#F8E6D7]"
          >
            <Search className="h-5 w-5" strokeWidth={1.9} />
          </Link>
          <Link
            href={APP_ROUTES.member}
            aria-label="會員中心"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5E4035] hover:bg-[#F8E6D7]"
          >
            <UserRound className="h-5 w-5" strokeWidth={1.9} />
          </Link>
          <Link
            href={APP_ROUTES.favorites}
            aria-label="收藏"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5E4035] hover:bg-[#F8E6D7]"
          >
            <Heart className="h-5 w-5" strokeWidth={1.9} />
          </Link>
          <Link
            href={APP_ROUTES.cart}
            aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件` : ""}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5E4035] hover:bg-[#F8E6D7]"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
            {cartCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E53935] px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </DesktopContainer>
    </header>
  );
}
