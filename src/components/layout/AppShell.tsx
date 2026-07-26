"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { isMinimalChromePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * App-first shell: phone full-bleed, tablet/desktop centered container.
 * Header→content gap and horizontal page padding come from design tokens once here
 * so every storefront page (including CMS blocks) shares the same inset.
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChromePad = !isMinimalChromePath(pathname);

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-background">
      <div className="app-shell relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-background md:shadow-lift">
        <AppHeader />
        <main
          className={cn(
            "page-enter min-w-0 flex-1 overflow-x-clip",
            showChromePad && "site-main site-container"
          )}
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
