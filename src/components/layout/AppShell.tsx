import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

/**
 * App-first shell: phone full-bleed, tablet/desktop centered container.
 * Prevents horizontal page scroll; reserves space for sticky header + bottom nav.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-cream-soft">
      <div className="app-shell relative mx-auto flex min-h-dvh w-full flex-col overflow-x-hidden bg-background md:shadow-lift">
        <AppHeader />
        <main
          className="app-main-pad page-enter min-w-0 flex-1 overflow-x-hidden"
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
