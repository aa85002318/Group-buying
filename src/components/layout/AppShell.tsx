"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { isMinimalChromePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * App-first shell: phone full-bleed, tablet/desktop centered container.
 * Homepage hides AppHeader so HomeHero yellow can start at the viewport top.
 * Main has no horizontal padding so color sections can go edge-to-edge.
 * Content inset (--page-padding-x) lives on .site-container inside each section.
 * Non-home pages wrap children once in .site-container; homepage manages its own.
 * HomeFooter is shown on all consumer pages (hidden on admin/staff/auth).
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isShopHub =
    pathname === "/shop" || pathname === "/shop/" || pathname.startsWith("/shop?");
  const fullBleedPage = isHome || isShopHub;
  const showChrome = !isMinimalChromePath(pathname);

  return (
    <div
      className={cn(
        "min-h-dvh w-full overflow-x-clip",
        isHome ? "bg-[#FDE045]" : isShopHub ? "bg-[#FFE149]" : "bg-background"
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip",
          isHome
            ? "max-w-none bg-[#FDE045]"
            : isShopHub
              ? "max-w-none bg-[#FFE149]"
              : "app-shell bg-background md:shadow-lift"
        )}
      >
        {/* Homepage & shop hub render their own headers (shop uses ShopHeader above hero). */}
        {!isHome && !isShopHub ? <AppHeader /> : null}
        <main
          className={cn(
            "page-enter min-w-0 flex-1 overflow-x-clip",
            showChrome && !fullBleedPage && "site-main"
          )}
          style={{
            paddingBottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {showChrome && !fullBleedPage ? (
            <div className="site-container mx-auto w-full min-w-0 max-w-full">
              {children}
            </div>
          ) : (
            <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
          )}
          {showChrome ? <HomeFooter /> : null}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
