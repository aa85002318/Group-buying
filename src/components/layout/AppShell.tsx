"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { isMinimalChromePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * App-first shell: phone full-bleed, tablet/desktop centered container.
 * Homepage hides AppHeader so BrandHero yellow can start at the viewport top.
 * Main has no horizontal padding so color sections can go edge-to-edge.
 * Content inset (--page-padding-x) lives on .site-container inside each section.
 * Non-home pages wrap children once in .site-container; homepage manages its own.
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showChrome = !isMinimalChromePath(pathname);

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-background">
      <div className="app-shell relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-background md:shadow-lift">
        {!isHome ? <AppHeader /> : null}
        <main
          className={cn(
            "page-enter min-w-0 flex-1 overflow-x-clip",
            showChrome && !isHome && "site-main"
          )}
          style={{
            paddingBottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {showChrome && !isHome ? (
            <div className="site-container mx-auto w-full min-w-0 max-w-full">
              {children}
            </div>
          ) : (
            <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
          )}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
