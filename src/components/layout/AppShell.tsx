import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream-soft">
      <div className="app-shell mx-auto min-h-dvh w-full max-w-full overflow-x-hidden bg-background md:max-w-[960px]">
        <AppHeader />
        <main
          className="page-enter px-4 md:px-6"
          style={{ paddingBottom: "calc(88px + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
