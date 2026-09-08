"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Search, ShoppingCart, UserRound } from "lucide-react";
import { DesktopBrandLogo } from "@/components/desktop/DesktopBrandLogo";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { useCart } from "@/hooks/useCart";
import { DESKTOP_COLORS } from "@/lib/desktop/brand-assets";
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
      className="sticky top-0 z-40"
      style={{ background: DESKTOP_COLORS.yellow, maxHeight: 84 }}
    >
      <DesktopContainer className="flex h-[80px] items-center gap-6">
        <DesktopBrandLogo height={48} priority className="shrink-0" />

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
                        : "text-[#153E73]/85 hover:text-[#153E73]"
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
          {(
            [
              [APP_ROUTES.search, "搜尋", Search],
              [APP_ROUTES.member, "會員中心", UserRound],
              [APP_ROUTES.favorites, "收藏", Heart],
            ] as const
          ).map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#153E73] hover:bg-white/40"
            >
              <Icon className="h-5 w-5" strokeWidth={1.9} />
            </Link>
          ))}
          <Link
            href={APP_ROUTES.cart}
            aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件` : ""}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#153E73] hover:bg-white/40"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
            {cartCount > 0 ? (
              <span
                className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: DESKTOP_COLORS.coral }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </DesktopContainer>
    </header>
  );
}
