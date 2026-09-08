"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { AppBottomNavigation } from "@/components/layout/AppBottomNavigation";
import { DesktopFooter } from "@/components/desktop/DesktopFooter";
import { DesktopHeader } from "@/components/desktop/DesktopHeader";
import { useIsDesktopLg } from "@/hooks/useIsDesktopLg";
import { isDesktopV2EnabledClient } from "@/lib/features/desktop-v2";
import { isMinimalChromePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * App-first shell: phone full-bleed, tablet/desktop centered container.
 * When Desktop V2 is enabled (≥1024 + staging flag), swap chrome to DesktopHeader/Footer.
 * Mobile Bottom Navigation markup/classes are untouched (still md:hidden).
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const desktopV2 = isDesktopV2EnabledClient() && useIsDesktopLg();
  const isHome = pathname === "/";
  const isShopHub =
    pathname === "/shop" || pathname === "/shop/" || pathname.startsWith("/shop?");
  const isGroupBuyHub =
    pathname === "/group-buy" ||
    pathname === "/group-buy/" ||
    pathname.startsWith("/group-buy?");
  const isRecipesHub =
    pathname === "/recipes" || pathname === "/recipes/" || pathname.startsWith("/recipes?");
  const isAiHub =
    pathname === "/ai" || pathname === "/ai/" || pathname.startsWith("/ai?");
  const isMemberHub = pathname === "/member" || pathname === "/member/";
  const yellowPlane = isHome || isShopHub || isGroupBuyHub || isAiHub;
  const fullBleedPage = yellowPlane || isRecipesHub || isMemberHub;
  const showChrome = !isMinimalChromePath(pathname);
  const showSiteFooter =
    showChrome && !isGroupBuyHub && !isRecipesHub && !isMemberHub;

  if (desktopV2) {
    return (
      <div
        className="desktop-v2-shell min-h-dvh w-full overflow-x-clip bg-[#FFFEFA]"
        data-desktop-v2="true"
      >
        <div className="relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip">
          {showChrome ? <DesktopHeader /> : null}
          <main className="page-enter min-w-0 flex-1 overflow-x-clip">{children}</main>
          {showChrome ? <DesktopFooter /> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-dvh w-full overflow-x-clip",
        yellowPlane ? "bg-[#FDE045]" : isMemberHub ? "bg-[#FFFEFA]" : "bg-background"
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip",
          yellowPlane
            ? "max-w-none bg-[#FDE045]"
            : isMemberHub
              ? "max-w-none bg-[#FFFEFA]"
              : "app-shell bg-background md:shadow-lift"
        )}
      >
        {/* Homepage / shop / group-buy / AI / member hub render their own headers. */}
        {!yellowPlane && !isRecipesHub && !isMemberHub ? <AppHeader /> : null}
        <main
          className={cn(
            "page-enter min-w-0 flex-1 overflow-x-clip",
            showChrome && !fullBleedPage && "site-main",
            isMemberHub
              ? "pb-0 md:pb-0"
              : "pb-[calc(112px+env(safe-area-inset-bottom,0px))] md:pb-0"
          )}
        >
          {showChrome && !fullBleedPage ? (
            <div className="site-container mx-auto w-full min-w-0 max-w-full">
              {children}
            </div>
          ) : (
            <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
          )}
          {showSiteFooter ? <HomeFooter /> : null}
        </main>
        <AppBottomNavigation />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
