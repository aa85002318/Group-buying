"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { DesktopBrandLogo } from "@/components/desktop/DesktopBrandLogo";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { useCart } from "@/hooks/useCart";
import { DESKTOP_COLORS } from "@/lib/desktop/brand-assets";
import { DESKTOP_NAV_LINKS } from "@/lib/features/desktop-v2";
import type { WebsiteNavItem } from "@/lib/site-nav";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Desktop header (≥1024): primary nav is truly centered on the header bar
 * (absolute center layer). Logo left / utilities right stay above via z-index.
 * Mobile header is untouched.
 */
type NavLink = Pick<WebsiteNavItem, "href" | "label"> &
  Partial<Pick<WebsiteNavItem, "id" | "newTab" | "children">>;

/** Header menu from 後台 › 網站外觀 › 頁首選單; built-in list until it loads. */
function useWebsiteNav(): NavLink[] {
  const [items, setItems] = useState<NavLink[]>(() => [...DESKTOP_NAV_LINKS]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/website-nav")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.items) && d.items.length) setItems(d.items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return items;
}

export function DesktopHeader() {
  const pathname = usePathname();
  const navLinks = useWebsiteNav();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu on navigation; lock page scroll while it is open.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header
      className="sticky top-0 z-50 bg-white/[0.96] shadow-[0_1px_0_rgba(21,62,115,0.08)] backdrop-blur-[10px]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <DesktopContainer className="relative flex h-16 items-center justify-between gap-2 lg:h-[80px]">
        <div className="z-20 flex shrink-0 items-center gap-1 lg:relative">
          <button
            type="button"
            aria-label="開啟選單"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#153E73] hover:bg-[#FFF5CC] lg:hidden"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </button>
          {/* Phones/tablets: logo centered; lg+: left beside the nav. */}
          <span className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0">
            <DesktopBrandLogo height={48} fluid priority />
          </span>
        </div>

        {/* True center: relative to full header container, not logo↔utils mid-gap */}
        <nav
          aria-label="桌機主選單"
          className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center lg:flex"
        >
          <ul
            className={cn(
              "pointer-events-auto flex items-center whitespace-nowrap",
              "gap-7 max-[1199px]:gap-4 xl:gap-8"
            )}
          >
            {navLinks.map((link) => {
              const children = link.children ?? [];
              const active =
                navActive(pathname, link.href) ||
                children.some((c) => navActive(pathname, c.href));
              const external = /^https?:\/\//i.test(link.href);
              return (
                <li key={link.id ?? link.href} className="group/nav relative">
                  <Link
                    href={link.href}
                    target={link.newTab || external ? "_blank" : undefined}
                    rel={link.newTab || external ? "noreferrer" : undefined}
                    className={cn(
                      "relative inline-flex items-center gap-0.5 rounded-sm px-0.5 pb-1 text-[15px] font-semibold tracking-wide text-[#153E73] transition-colors",
                      "max-[1199px]:text-[14px]",
                      !active && "text-[#153E73]/85 hover:text-[#153E73]"
                    )}
                  >
                    {link.label}
                    {children.length ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : null}
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#FFD454]"
                      />
                    ) : null}
                  </Link>
                  {children.length ? (
                    <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition group-hover/nav:visible group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:opacity-100">
                      <ul className="min-w-[180px] rounded-2xl border border-[#E9EDF2] bg-white p-2 shadow-lg">
                        {children.map((c) => (
                          <li key={c.id ?? c.href}>
                            <Link
                              href={c.href}
                              className={cn(
                                "block rounded-xl px-3 py-2 text-sm font-semibold text-[#153E73] hover:bg-[#FFF5CC]",
                                navActive(pathname, c.href) && "bg-[#FFF5CC]"
                              )}
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative z-20 shrink-0">
          <div className="flex items-center justify-end gap-1 sm:gap-3 xl:gap-4">
            <Link
              href={APP_ROUTES.search}
              aria-label="搜尋"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full bg-[#F6F7F9] text-[#153E73] hover:bg-[#FFF5CC]",
                // Icon-only below 1536px so the 8-item centered nav never
                // collides with the search pill (e.g. 門市資訊 at 1280–1535px).
                "w-10 max-w-10 justify-center px-0",
                "2xl:w-[220px] 2xl:max-w-[220px] 2xl:justify-start 2xl:px-3",
                "ring-1 ring-[#153E73]/10"
              )}
            >
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.9} />
              <span className="hidden truncate text-sm text-[#153E73]/70 2xl:inline">
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
                className={cn(
                  "h-10 w-10 items-center justify-center rounded-full text-[#153E73] hover:bg-[#FFF5CC]",
                  // Phones keep search + cart only; the rest sit in the menu.
                  "hidden lg:inline-flex"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </Link>
            ))}

            <Link
              href={APP_ROUTES.cart}
              aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件` : ""}`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#153E73] hover:bg-[#FFF5CC]"
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

      {/* Phone / tablet menu (same items as the desktop nav, from 後台 › 頁首選單) */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="網站選單">
          <button
            type="button"
            aria-label="關閉選單"
            className="absolute inset-0 bg-[#153E73]/35"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="absolute inset-y-0 left-0 flex w-[82vw] max-w-[340px] flex-col overflow-y-auto bg-[#FFFEFA] shadow-xl"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <div className="flex h-16 items-center justify-between px-4" style={{ background: DESKTOP_COLORS.yellow }}>
              <DesktopBrandLogo height={36} />
              <button
                type="button"
                aria-label="關閉選單"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#153E73] hover:bg-[#FFF5CC]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <Link
              href={APP_ROUTES.search}
              className="mx-4 mt-4 flex h-11 items-center gap-2 rounded-full border border-[#E9EDF2] bg-white px-4 text-sm text-[#687386]"
            >
              <Search className="h-4 w-4" />
              搜尋商品、食譜…
            </Link>
            <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
              <Link
                href={APP_ROUTES.member}
                className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#FFD454] text-sm font-bold text-[#153E73]"
              >
                <UserRound className="h-4 w-4" />
                會員中心
              </Link>
              <Link
                href={APP_ROUTES.favorites}
                className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#E9EDF2] bg-white text-sm font-bold text-[#153E73]"
              >
                <Heart className="h-4 w-4" />
                我的收藏
              </Link>
            </div>
            <ul className="mt-3 flex-1 px-2 pb-6">
              {navLinks.map((link) => {
                const children = link.children ?? [];
                const active = navActive(pathname, link.href);
                return (
                  <li key={link.id ?? link.href} className="border-b border-[#F0ECE5] last:border-0">
                    <Link
                      href={link.href}
                      target={link.newTab ? "_blank" : undefined}
                      rel={link.newTab ? "noreferrer" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-[#153E73]",
                        active && "bg-[#FFF5CC]"
                      )}
                    >
                      {link.label}
                    </Link>
                    {children.length ? (
                      <ul className="pb-2 pl-4">
                        {children.map((c) => (
                          <li key={c.id ?? c.href}>
                            <Link
                              href={c.href}
                              className={cn(
                                "flex min-h-10 items-center rounded-lg px-3 text-sm text-[#465467]",
                                navActive(pathname, c.href) && "bg-[#FFF5CC] font-semibold text-[#153E73]"
                              )}
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
