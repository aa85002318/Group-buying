"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

/**
 * App-first shell: phone full-bleed, tablet/desktop centered container.
 * Prevents horizontal page scroll; reserves space for sticky header + bottom nav.
 * The homepage manages its own horizontal padding — other pages use app-main-pad.
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-background">
      <div className="app-shell relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-background md:shadow-lift">
        <AppHeader />
        <main
          className={[
            "page-enter min-w-0 flex-1 overflow-x-clip",
            isHome ? "" : "app-main-pad",
          ]
            .join(" ")
            .trim()}
          style={{
            paddingBottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
