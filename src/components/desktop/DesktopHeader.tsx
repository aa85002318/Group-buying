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

/**
 * Desktop header (≥1024): 3-column grid so primary nav is truly viewport-centered
 * regardless of logo / utility widths. Mobile header is untouched.
 */
export function DesktopHeader() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: DESKTOP_COLORS.yellow }}
    >
      <DesktopContainer
        className={cn(
          "grid h-[80px] items-center",
          "grid-cols-[1fr_auto_1fr]"
        )}
      >
        <div className="justify-self-start">
          <DesktopBrandLogo height={48} priority />
        </div>

        <nav
          aria-label="桌機主選單"
          className="justify-self-center px-2 max-[1199px]:px-1"
        >
          <ul
            className={cn(
              "flex items-center whitespace-nowrap",
              "gap-7 max-[1199px]:gap-4 xl:gap-8 2xl:gap-9"
            )}
          >
            {DESKTOP_NAV_LINKS.map((link) => {
              const active = navActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "relative inline-flex pb-1 text-[15px] font-semibold tracking-wide text-[#153E73] transition-colors",
                      "max-[1199px]:text-[14px]",
                      !active && "text-[#153E73]/85 hover:text-[#153E73]"
                    )}
                  >
                    {link.label}
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#153E73]"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="justify-self-end">
          <div className="flex items-center justify-end gap-3 xl:gap-4">
            <Link
              href={APP_ROUTES.search}
              aria-label="搜尋"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full bg-white/55 px-3 text-[#153E73] hover:bg-white/75",
                "w-[180px] max-w-[180px] xl:w-[240px] xl:max-w-[240px] 2xl:w-[280px] 2xl:max-w-[280px]",
                "max-[1199px]:w-10 max-[1199px]:max-w-10 max-[1199px]:justify-center max-[1199px]:px-0"
              )}
            >
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.9} />
              <span className="truncate text-sm text-[#153E73]/70 max-[1199px]:hidden">
                搜尋商品、食譜…
              </span>
            </Link>

            {(
              [
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
        </div>
      </DesktopContainer>
    </header>
  );
}
